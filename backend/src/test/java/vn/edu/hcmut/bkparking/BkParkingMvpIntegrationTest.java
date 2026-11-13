package vn.edu.hcmut.bkparking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BkParkingMvpIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAndGetToken(String username, String password) throws Exception {
        String body = String.format("{\"username\":\"%s\",\"password\":\"%s\"}", username, password);
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        return root.path("data").path("accessToken").asText();
    }

    @Test
    void fullEndToEndMvpFlow_UserRegister_AdminApprove_StaffCheckInOut_PublicViewUpdates() throws Exception {
        // 0. Public View accessible without token
        MvcResult publicBeforeRes = mockMvc.perform(get("/api/v1/public/parking-lots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalLots").value(5))
                .andReturn();
        JsonNode publicBefore = objectMapper.readTree(publicBeforeRes.getResponse().getContentAsString());
        long initialTotalOccupied = publicBefore.path("data").path("totalOccupied").asLong();

        // 1. Login as User (sv.tran), Admin (admin), Staff (staff.gate)
        String userToken = loginAndGetToken("sv.tran", "123456");
        String adminToken = loginAndGetToken("admin", "123456");
        String staffToken = loginAndGetToken("staff.gate", "123456");

        // Verify Role Guard: User cannot call Admin endpoint
        mockMvc.perform(get("/api/v1/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // 2. User registers a new motorbike (59C1-777.88) -> status PENDING
        String registerPayload = """
                {
                  "licensePlate": "59C1-777.88",
                  "vehicleType": "MOTORBIKE",
                  "brand": "Honda",
                  "model": "Lead 125",
                  "color": "Bạc",
                  "registrationDocUrl": "https://demo.bkparking.edu.vn/docs/cavet-77788.jpg"
                }
                """;
        MvcResult regRes = mockMvc.perform(post("/api/v1/vehicles")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();
        long newVehicleId = objectMapper.readTree(regRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Duplicate license plate must be rejected with 409 DUPLICATE_LICENSE_PLATE
        mockMvc.perform(post("/api/v1/vehicles")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_LICENSE_PLATE"));

        // Opening QR before approval must fail with VEHICLE_NOT_APPROVED
        mockMvc.perform(get("/api/v1/vehicles/" + newVehicleId + "/qr")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VEHICLE_NOT_APPROVED"));

        // 3. Admin approves the vehicle
        mockMvc.perform(patch("/api/v1/admin/vehicles/" + newVehicleId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.qrToken").isNotEmpty());

        // 4. User opens QR and gets dynamic qrToken
        MvcResult qrRes = mockMvc.perform(get("/api/v1/vehicles/" + newVehicleId + "/qr")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.packageEligible").value(true))
                .andReturn();
        String qrToken = objectMapper.readTree(qrRes.getResponse().getContentAsString())
                .path("data").path("qrToken").asText();
        assertThat(qrToken).startsWith("BKQR-VEH");

        // 5. Staff scans QR -> recommendedAction is CHECK_IN
        mockMvc.perform(post("/api/v1/staff/qr/verify")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrOrPlate\":\"" + qrToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.recommendedAction").value("CHECK_IN"));

        // 6. Staff performs Check-In at Parking Lot 2 (Nhà xe B1)
        String checkInBody = String.format("{\"qrOrPlate\":\"%s\",\"parkingLotId\":2,\"entryGate\":\"Cổng B1 - Làn 1\"}", qrToken);
        mockMvc.perform(post("/api/v1/staff/sessions/check-in")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkInBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        // Prevent duplicate open session for same vehicle
        mockMvc.perform(post("/api/v1/staff/sessions/check-in")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkInBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SESSION_ALREADY_ACTIVE"));

        // Public View occupied count increased by 1
        MvcResult publicDuringRes = mockMvc.perform(get("/api/v1/public/parking-lots"))
                .andExpect(status().isOk())
                .andReturn();
        long duringOccupied = objectMapper.readTree(publicDuringRes.getResponse().getContentAsString())
                .path("data").path("totalOccupied").asLong();
        assertThat(duringOccupied).isEqualTo(initialTotalOccupied + 1);

        // Admin cannot set capacity of Lot 1 below its currently occupied count (1 vehicle in Lot 1)
        mockMvc.perform(put("/api/v1/admin/parking-lots/1")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"capacity\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CAPACITY_BELOW_OCCUPIED"));

        // 7. Staff performs Check-Out -> session becomes COMPLETED and occupancy returns to initial
        String checkOutBody = String.format("{\"qrOrPlate\":\"%s\",\"exitGate\":\"Cổng B1 - Làn Ra\"}", qrToken);
        mockMvc.perform(post("/api/v1/staff/sessions/check-out")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkOutBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.checkoutTime").isNotEmpty());

        MvcResult publicAfterRes = mockMvc.perform(get("/api/v1/public/parking-lots"))
                .andExpect(status().isOk())
                .andReturn();
        long afterOccupied = objectMapper.readTree(publicAfterRes.getResponse().getContentAsString())
                .path("data").path("totalOccupied").asLong();
        assertThat(afterOccupied).isEqualTo(initialTotalOccupied);
    }
}


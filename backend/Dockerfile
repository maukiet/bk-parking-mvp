# ==========================================
# Multi-stage Build for BK Parking Backend
# ==========================================

# Stage 1: Build JAR using Maven & Temurin JDK 21
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Pre-fetch dependencies to speed up rebuilds
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Runtime using Temurin JRE 21 Alpine
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add security best practice: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy built JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

# Configure JVM tuning & container flags
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

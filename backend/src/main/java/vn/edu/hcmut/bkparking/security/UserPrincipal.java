package vn.edu.hcmut.bkparking.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import vn.edu.hcmut.bkparking.entity.User;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {
    private final Long id;
    private final String username;
    private final String password;
    private final String fullName;
    private final String code;
    private final String email;
    private final String roleCode;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.password = user.getPasswordHash();
        this.fullName = user.getFullName();
        this.code = user.getCode();
        this.email = user.getEmail();
        this.roleCode = user.getRole().getCode();
        this.active = "ACTIVE".equalsIgnoreCase(user.getStatus());
        this.authorities = List.of(new SimpleGrantedAuthority(this.roleCode));
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getCode() { return code; }
    public String getEmail() { return email; }
    public String getRoleCode() { return roleCode; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return active; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}


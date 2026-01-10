namespace OrgLicenseManager.Contracts.Auth.Requests;

public record LoginRequest(
    string UserId,
    string Email,
    string Role
);

namespace OrgLicenseManager.Contracts.Auth.Responses;

public record LoginResponse(
    string Token,
    DateTime ExpiresAt,
    string UserId,
    string Email,
    string Role
);

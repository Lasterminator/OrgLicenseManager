namespace OrgLicenseManager.Contracts.Auth.Responses;

public record ClaimsResponse(
    string? UserId,
    string? Email,
    string? Role,
    List<ClaimItem> AllClaims
);

public record ClaimItem(
    string Type,
    string Value
);

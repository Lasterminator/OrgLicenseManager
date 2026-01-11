namespace OrgLicenseManager.Contracts.Organizations.Responses;

public record UserOrganizationResponse(
    Guid Id,
    string Name,
    string? Description,
    string Role,
    DateTime JoinedAt);

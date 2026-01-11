namespace OrgLicenseManager.Contracts.Organizations.Responses;

public record OrganizationResponse(
    Guid Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int MemberCount);

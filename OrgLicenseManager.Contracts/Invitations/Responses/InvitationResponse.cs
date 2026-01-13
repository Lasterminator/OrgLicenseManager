namespace OrgLicenseManager.Contracts.Invitations.Responses;

public record InvitationResponse(
    Guid Id,
    Guid OrganizationId,
    string OrganizationName,
    string Email,
    string Role,
    DateTime ExpiresAt,
    string Token,
    Guid? InvitedByUserId,
    DateTime CreatedAt);

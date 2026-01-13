using System.ComponentModel.DataAnnotations;

namespace OrgLicenseManager.Contracts.Invitations.Requests;

public record AcceptInvitationRequest(
    [Required(ErrorMessage = "Invitation token is required")]
    [StringLength(100, MinimumLength = 10, ErrorMessage = "Invalid invitation token")]
    string Token);

using System.ComponentModel.DataAnnotations;

namespace OrgLicenseManager.Contracts.Invitations.Requests;

public record CreateInvitationRequest(
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(256, ErrorMessage = "Email cannot exceed 256 characters")]
    string Email,

    [Required(ErrorMessage = "Role is required")]
    [RegularExpression("^(Owner|Admin|Member)$", ErrorMessage = "Role must be Owner, Admin, or Member")]
    string Role = "Member");

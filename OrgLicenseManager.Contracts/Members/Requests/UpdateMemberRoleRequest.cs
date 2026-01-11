using System.ComponentModel.DataAnnotations;

namespace OrgLicenseManager.Contracts.Members.Requests;

public record UpdateMemberRoleRequest(
    [Required(ErrorMessage = "Role is required")]
    [RegularExpression("^(Owner|Admin|Member)$", ErrorMessage = "Role must be Owner, Admin, or Member")]
    string Role);

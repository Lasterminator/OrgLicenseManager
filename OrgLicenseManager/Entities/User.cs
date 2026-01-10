namespace OrgLicenseManager.Entities;

public class User
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<OrganizationMembership> Memberships { get; set; } = [];
    public ICollection<License> AssignedLicenses { get; set; } = [];
    public ICollection<Invitation> SentInvitations { get; set; } = [];
}

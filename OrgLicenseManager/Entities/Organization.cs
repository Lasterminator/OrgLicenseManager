namespace OrgLicenseManager.Entities;

public class Organization
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<OrganizationMembership> Memberships { get; set; } = [];
    public ICollection<License> Licenses { get; set; } = [];
    public ICollection<Invitation> Invitations { get; set; } = [];
}

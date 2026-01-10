namespace OrgLicenseManager.Entities;

public class OrganizationMembership
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public OrganizationRole Role { get; set; }
    public DateTime JoinedAt { get; set; }

    public Organization Organization { get; set; } = null!;
    public User User { get; set; } = null!;
    public License? AssignedLicense { get; set; }
    public Guid? AssignedLicenseId { get; set; }
}

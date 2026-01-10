namespace OrgLicenseManager.Entities;

public class License
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid? AssignedToUserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool AutoRenewal { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Organization Organization { get; set; } = null!;
    public User? AssignedToUser { get; set; }
}

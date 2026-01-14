using System.ComponentModel.DataAnnotations;

namespace OrgLicenseManager.Contracts.Common;

public class PaginationRequest
{
    private const int MaxPageSize = 100;
    private const int DefaultPageSize = 10;

    private int _pageSize = DefaultPageSize;

    [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1")]
    public int Page { get; set; } = 1;

    [Range(1, MaxPageSize, ErrorMessage = "PageSize must be between 1 and 100")]
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }

    public string? SortBy { get; set; }

    public bool SortDescending { get; set; } = false;

    public string? Search { get; set; }
}

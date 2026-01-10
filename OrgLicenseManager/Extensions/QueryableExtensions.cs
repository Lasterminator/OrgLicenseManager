using System.Linq.Expressions;
using OrgLicenseManager.Contracts.Common;
using Microsoft.EntityFrameworkCore;

namespace OrgLicenseManager.Extensions;

public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        PaginationRequest request,
        CancellationToken cancellationToken = default)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(
            Items: items,
            Page: request.Page,
            PageSize: request.PageSize,
            TotalCount: totalCount,
            TotalPages: totalPages,
            HasPreviousPage: request.Page > 1,
            HasNextPage: request.Page < totalPages);
    }

    public static IQueryable<T> ApplySort<T>(
        this IQueryable<T> query,
        string? sortBy,
        bool descending,
        Dictionary<string, Expression<Func<T, object>>> sortMappings,
        Expression<Func<T, object>> defaultSort)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return descending
                ? query.OrderByDescending(defaultSort)
                : query.OrderBy(defaultSort);
        }

        if (sortMappings.TryGetValue(sortBy.ToLowerInvariant(), out var sortExpression))
        {
            return descending
                ? query.OrderByDescending(sortExpression)
                : query.OrderBy(sortExpression);
        }

        return descending
            ? query.OrderByDescending(defaultSort)
            : query.OrderBy(defaultSort);
    }
}

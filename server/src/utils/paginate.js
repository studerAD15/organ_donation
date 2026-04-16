/**
 * Pagination helper — extracts page/limit from query params
 * and returns skip offset for MongoDB .skip().limit() queries.
 * 
 * @param {object} query - req.query object
 * @param {number} [defaultLimit=20] - Default items per page
 * @param {number} [maxLimit=100] - Maximum allowed limit
 * @returns {{ page, limit, skip }}
 */
export const paginate = (query = {}, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds a standardized pagination response envelope.
 * 
 * @param {object} params
 * @param {any[]} params.data - Items for current page
 * @param {number} params.total - Total document count
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Items per page
 * @returns {object} - { data, pagination }
 */
export const paginatedResponse = ({ data, total, page, limit }) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  }
});

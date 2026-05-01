/**
 * Paginates a Sequelize findAndCountAll query.
 *
 * @param {Model}  Model      - Sequelize model (e.g. Job, Application)
 * @param {object} queryOptions - Sequelize query options (where, include, order, etc.)
 * @param {object} paginationParams - { page, limit } from req.query (already validated)
 * @returns {{ rows, pagination }} — rows are the result records; pagination is metadata
 *
 * Usage in a service:
 *   const { rows, pagination } = await paginate(Job, { where: filters, order }, { page, limit });
 *   return responsePaginated(res, rows, pagination);
 */
const paginate = async (Model, queryOptions = {}, { page = 1, limit = 10 } = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); 
  const offset   = (pageNum - 1) * limitNum;

  const { count, rows } = await Model.findAndCountAll({
    ...queryOptions,
    limit: limitNum,
    offset,
    distinct: true, 
  });

  return {
    rows,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
      hasNextPage: pageNum < Math.ceil(count / limitNum),
      hasPrevPage: pageNum > 1,
    },
  };
};

const getPaginationParams = (query) => ({
  page:  Math.max(1, parseInt(query.page,  10) || 1),
  limit: Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10)),
});

module.exports = { paginate, getPaginationParams };
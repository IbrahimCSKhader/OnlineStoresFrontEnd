export function groupProductsByCategory(products, categories, otherLabel) {
  const groups = [...categories].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)).map(category => ({ ...category, id: String(category.id), products: [] }));
  const byId = new Map(groups.map(group => [group.id, group]));
  for (const product of products) {
    const id = String(product.categoryId || "uncategorized");
    if (!byId.has(id)) {
      const group = { id, name: product.categoryName || otherLabel, products: [] };
      byId.set(id, group);
      groups.push(group);
    }
    byId.get(id).products.push(product);
  }
  return groups.filter(group => group.products.length);
}

export function paginateCategoryGroups(groups, page, pageSize) {
  const products = groups.flatMap(group => group.products);
  const totalCount = products.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const items = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return { items, page: currentPage, pageSize, totalCount, totalPages,
    hasPreviousPage: currentPage > 1, hasNextPage: currentPage < totalPages };
}

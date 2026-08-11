const compareMembers = (left, right) => {
  const orderDifference = Number(left?.sortOrder || 0) - Number(right?.sortOrder || 0)
  if (orderDifference !== 0) return orderDifference
  return Number(left?.id || 0) - Number(right?.id || 0)
}

export const buildOrganizationTree = (members = []) => {
  const nodes = new Map(
    members.map((member) => [Number(member.id), { ...member, children: [] }]),
  )
  const roots = []

  nodes.forEach((node) => {
    const parent = node.parentId == null ? null : nodes.get(Number(node.parentId))
    if (parent && parent.id !== node.id) parent.children.push(node)
    else roots.push(node)
  })

  const sortBranch = (branch) => {
    branch.sort(compareMembers)
    branch.forEach((node) => sortBranch(node.children))
    return branch
  }

  return sortBranch(roots)
}

export const flattenOrganizationTree = (tree = [], depth = 0) =>
  tree.flatMap((node) => [
    { ...node, depth },
    ...flattenOrganizationTree(node.children || [], depth + 1),
  ])

export const getOrganizationDescendantIds = (members = [], memberId) => {
  const childrenByParent = new Map()
  members.forEach((member) => {
    const key = member.parentId == null ? null : Number(member.parentId)
    childrenByParent.set(key, [...(childrenByParent.get(key) || []), Number(member.id)])
  })

  const descendants = []
  const pending = [Number(memberId)]
  while (pending.length) {
    const current = pending.shift()
    const children = [...(childrenByParent.get(current) || [])].sort((left, right) => left - right)
    children.forEach((id) => {
      if (!descendants.includes(id)) {
        descendants.push(id)
        pending.push(id)
      }
    })
  }
  return descendants
}

export const organizationApiError = (error, fallback) => {
  const errors = error?.response?.data?.errors
  if (errors) return Object.values(errors).flat().join(' ')
  return error?.response?.data?.message || error?.message || fallback
}

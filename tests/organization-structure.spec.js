import { describe, expect, it } from 'vitest'
import {
  buildOrganizationTree,
  flattenOrganizationTree,
  getOrganizationDescendantIds,
  organizationApiError,
} from '../src/utils/organizationStructure'

const members = [
  { id: 3, parentId: 1, name: 'Divisi B', sortOrder: 1 },
  { id: 1, parentId: null, name: 'Kepala', sortOrder: 0 },
  { id: 4, parentId: 2, name: 'Staf', sortOrder: 0 },
  { id: 2, parentId: 1, name: 'Divisi A', sortOrder: 0 },
]

describe('organization structure hierarchy', () => {
  it('builds and orders an arbitrary-depth tree', () => {
    const tree = buildOrganizationTree(members)

    expect(tree).toHaveLength(1)
    expect(tree[0].name).toBe('Kepala')
    expect(tree[0].children.map((item) => item.name)).toEqual(['Divisi A', 'Divisi B'])
    expect(tree[0].children[0].children[0].name).toBe('Staf')
  })

  it('flattens the tree with depth information for admin rendering', () => {
    const flattened = flattenOrganizationTree(buildOrganizationTree(members))

    expect(flattened.map(({ name, depth }) => [name, depth])).toEqual([
      ['Kepala', 0],
      ['Divisi A', 1],
      ['Staf', 2],
      ['Divisi B', 1],
    ])
  })

  it('returns every descendant so invalid parent options can be excluded', () => {
    expect(getOrganizationDescendantIds(members, 1)).toEqual([2, 3, 4])
    expect(getOrganizationDescendantIds(members, 2)).toEqual([4])
  })

  it('formats API validation and fallback errors', () => {
    expect(
      organizationApiError(
        { response: { data: { errors: { parent_id: ['Induk tidak valid.'] } } } },
        'Gagal.',
      ),
    ).toBe('Induk tidak valid.')
    expect(organizationApiError({}, 'Gagal.')).toBe('Gagal.')
  })
})

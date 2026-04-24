/**
 * Minimal B+ tree builder used purely for *visualization* of how an index on a
 * column might look. It is not a production B-tree: no on-disk serialization,
 * no concurrency, and splits are straightforward.
 *
 * Semantics
 *   - Order `m` is the maximum number of children per internal node.
 *   - A leaf holds up to `m - 1` keys. If it overflows we split at the middle
 *     and promote the split key to the parent.
 *   - Keys are compared with a user-supplied comparator so we can visualize
 *     both numeric and text indexes.
 */

export type Cmp<T> = (a: T, b: T) => number;

export interface BTreeNode<T> {
  leaf: boolean;
  keys: T[];
  children: BTreeNode<T>[];
}

function newLeaf<T>(): BTreeNode<T> {
  return { leaf: true, keys: [], children: [] };
}
function newInternal<T>(): BTreeNode<T> {
  return { leaf: false, keys: [], children: [] };
}

/**
 * Insert into a node that is guaranteed to have room (caller handles root
 * splits). Returns the (possibly-split) replacement pair `{ node, split? }`.
 */
function insertIntoNode<T>(
  node: BTreeNode<T>,
  key: T,
  order: number,
  cmp: Cmp<T>,
): { promoted?: { key: T; right: BTreeNode<T> } } {
  if (node.leaf) {
    let i = node.keys.length;
    while (i > 0 && cmp(node.keys[i - 1], key) > 0) i--;
    node.keys.splice(i, 0, key);

    if (node.keys.length <= order - 1) return {};

    const mid = Math.floor(node.keys.length / 2);
    const right = newLeaf<T>();
    right.keys = node.keys.splice(mid);
    const promotedKey = right.keys[0];
    return { promoted: { key: promotedKey, right } };
  }

  let i = 0;
  while (i < node.keys.length && cmp(key, node.keys[i]) >= 0) i++;
  const result = insertIntoNode(node.children[i], key, order, cmp);
  if (!result.promoted) return {};

  node.keys.splice(i, 0, result.promoted.key);
  node.children.splice(i + 1, 0, result.promoted.right);

  if (node.children.length <= order) return {};

  const midIdx = Math.floor(node.keys.length / 2);
  const promotedKey = node.keys[midIdx];
  const right = newInternal<T>();
  right.keys = node.keys.splice(midIdx + 1);
  right.children = node.children.splice(midIdx + 1);
  node.keys.splice(midIdx, 1);
  return { promoted: { key: promotedKey, right } };
}

export function buildBTree<T>(
  keys: T[],
  order: number,
  cmp: Cmp<T>,
): BTreeNode<T> {
  if (order < 3) order = 3;
  let root: BTreeNode<T> = newLeaf<T>();
  for (const k of keys) {
    const result = insertIntoNode(root, k, order, cmp);
    if (result.promoted) {
      const newRoot = newInternal<T>();
      newRoot.keys = [result.promoted.key];
      newRoot.children = [root, result.promoted.right];
      root = newRoot;
    }
  }
  return root;
}

export interface LaidOutNode<T> {
  node: BTreeNode<T>;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface LaidOutEdge {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface BTreeLayout<T> {
  nodes: LaidOutNode<T>[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
}

/**
 * Simple tree layout: assigns each node an x based on the midpoint of its
 * children, and y based on its depth. Good enough for < 100 keys.
 */
export function layoutBTree<T>(
  root: BTreeNode<T>,
  options: {
    keyWidth?: number;
    keyHeight?: number;
    hGap?: number;
    vGap?: number;
    formatKey?: (k: T) => string;
  } = {},
): BTreeLayout<T> {
  const keyWidth = options.keyWidth ?? 36;
  const keyHeight = options.keyHeight ?? 26;
  const hGap = options.hGap ?? 16;
  const vGap = options.vGap ?? 48;

  const nodes: LaidOutNode<T>[] = [];
  const edges: LaidOutEdge[] = [];
  let cursorX = 0;

  const nodeWidth = (n: BTreeNode<T>) =>
    Math.max(keyWidth, n.keys.length * keyWidth + 8);

  function walk(n: BTreeNode<T>, depth: number): LaidOutNode<T> {
    const width = nodeWidth(n);
    const y = depth * vGap;
    let entry: LaidOutNode<T>;

    if (n.leaf || n.children.length === 0) {
      const x = cursorX;
      cursorX += width + hGap;
      entry = { node: n, x, y, width, height: keyHeight, depth };
    } else {
      const childEntries = n.children.map((c) => walk(c, depth + 1));
      const leftMost = childEntries[0].x;
      const rightMost =
        childEntries[childEntries.length - 1].x +
        childEntries[childEntries.length - 1].width;
      const x = (leftMost + rightMost) / 2 - width / 2;
      entry = { node: n, x, y, width, height: keyHeight, depth };

      for (const child of childEntries) {
        edges.push({
          from: { x: x + width / 2, y: y + keyHeight },
          to: { x: child.x + child.width / 2, y: child.y },
        });
      }
    }

    nodes.push(entry);
    return entry;
  }

  walk(root, 0);

  const xs = nodes.map((n) => n.x);
  const rs = nodes.map((n) => n.x + n.width);
  const ys = nodes.map((n) => n.y + n.height);

  return {
    nodes,
    edges,
    width: Math.max(...rs) - Math.min(...xs),
    height: Math.max(...ys),
  };
}

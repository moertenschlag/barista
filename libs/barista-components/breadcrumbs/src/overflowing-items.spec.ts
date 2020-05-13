/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { determineOverflowingItems } from './overflowing-items';

describe('determineOverflowingItems', () => {
  let containerRect = { width: 500 } as DOMRect;

  it('should return an empty array when the items map is empty', () => {
    expect(determineOverflowingItems(containerRect, new Map(), 0)).toEqual([]);
    expect(determineOverflowingItems(containerRect, new Map(), 36)).toEqual([]);
  });

  it('should return all items except the last item (last item is never included)', () => {
    let itemsMap = new Map<string, number>([
      ['item1', 300],
      ['item2', 100],
      ['item3', 550],
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 0)).toEqual([
      'item1',
      'item2',
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 36)).toEqual([
      'item1',
      'item2',
    ]);

    itemsMap = new Map<string, number>([
      ['item1', 50],
      ['item2', 1000],
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 0)).toEqual([
      'item1',
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 36)).toEqual([
      'item1',
    ]);
  });

  it('should return all overflowing items', () => {
    let itemsMap = new Map<string, number>([
      ['item1', 200],
      ['item2', 200],
      ['item3', 200],
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 0)).toEqual([
      'item1',
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 36)).toEqual([
      'item1',
    ]);

    itemsMap = new Map<string, number>([
      ['item1', 200],
      ['item2', 200],
      ['item3', 400],
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 0)).toEqual([
      'item1',
      'item2',
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 36)).toEqual([
      'item1',
      'item2',
    ]);

    itemsMap = new Map<string, number>([
      ['item1', 200],
      ['item2', 100],
      ['item3', 400],
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 0)).toEqual([
      'item1',
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 36)).toEqual([
      'item1',
      'item2',
    ]);
  });

  it('should return one additional item if the reserved space is bigger than the next item', () => {
    let itemsMap = new Map<string, number>([
      ['item1', 200],
      ['item2', 50],
      ['item3', 400],
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 60)).toEqual([
      'item1',
      'item2',
    ]);
    itemsMap = new Map<string, number>([
      ['item1', 200],
      ['item2', 100],
      ['item3', 400],
    ]);
    expect(determineOverflowingItems(containerRect, itemsMap, 150)).toEqual([
      'item1',
      'item2',
    ]);
  });
});

/// <reference types="jest" />
import cases from './search-cases.json';
import { createFuzzySearch, fuzzySearch } from './fuzzy-search';

it.each(cases)('matches the search policy for "$query"', ({ names, query, expected }) => {
  const indices = names.map((_, index) => index);
  expect(fuzzySearch(indices, query, (index) => names[index])).toEqual(expected);
});

it('keeps original objects and supports nested product names without mutating input', () => {
  const entries = [{ product: { name: 'Milk' } }, { product: { name: 'Chicken Breast' } }];
  expect(fuzzySearch(entries, 'chiken', (entry) => entry.product.name)).toEqual([entries[1]]);
  expect(fuzzySearch(entries, ' ', (entry) => entry.product.name)).toEqual(entries);
  expect(entries[0].product.name).toBe('Milk');
});


it('ranks exact matches, word prefixes, substrings, then typos like the web Select', () => {
  const names = ['Milx', 'Buttermilk', 'Milk powder', 'Milk'];
  expect(fuzzySearch(names, 'milk', (name) => name)).toEqual(['Milk', 'Milk powder', 'Buttermilk', 'Milx']);
});

it('keeps short and numeric terms literal while allowing typos in longer words', () => {
  const names = ['Milk 2%', 'Milk 3%', 'Soy Milk'];
  expect(fuzzySearch(['Chicken 2', 'Chicken 3'], 'chiken 2', (name) => name)).toEqual(['Chicken 2']);
  expect(fuzzySearch(names, 'mil 2', (name) => name)).toEqual(['Milk 2%']);
  expect(fuzzySearch(names, 'so', (name) => name)).toEqual(['Soy Milk']);
  expect(fuzzySearch(names, 'sx', (name) => name)).toEqual([]);
});

it('normalizes Latin letters using the same deburr behavior as the web Select', () => {
  expect(fuzzySearch(['Łódź', 'Crème fraîche'], 'lodz', (name) => name)).toEqual(['Łódź']);
});

it('matches reordered words and aliases using token search', () => {
  const items = [{ name: 'United Kingdom', aliases: ['Britain', '+44'] }, { name: 'Poland', aliases: ['+48'] }];
  const { search } = createFuzzySearch({ items, getSearchTerms: (item) => [item.name, ...item.aliases] });
  expect(search('britan united 44').items).toEqual([items[0]]);
  expect(search('britan united 48').items).toEqual([]);
});

it('prepares searchable terms once across successive queries', () => {
  const getSearchTerms = jest.fn((name: string) => [name]);
  const search = createFuzzySearch({ items: ['Milk', 'Chicken'], getSearchTerms });
  expect(search.search('mi').items).toEqual(['Milk']);
  expect(search.search('chiken').items).toEqual(['Chicken']);
  expect(search.search('nothing').items).toEqual([]);
  expect(getSearchTerms).toHaveBeenCalledTimes(2);
});

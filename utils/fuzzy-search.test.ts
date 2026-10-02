/// <reference types="jest" />
import cases from './search-cases.json';
import { createFuzzySearch } from './fuzzy-search';

it.each(cases)('matches the search policy for "$query"', ({ names, query, expected }) => {
  const indices = names.map((_, index) => index);
  const index = createFuzzySearch({ items: indices, getSearchTerms: (index) => [names[index]] });
  expect(index.search(query).items).toEqual(expected);
});

it('keeps original objects and supports nested product names without mutating input', () => {
  const entries = [{ product: { name: 'Milk' } }, { product: { name: 'Chicken Breast' } }];
  const index = createFuzzySearch({ items: entries, getSearchTerms: (entry) => [entry.product.name] });
  expect(index.search('chiken').items).toEqual([entries[1]]);
  expect(index.search(' ').items).toEqual(entries);
  expect(entries[0].product.name).toBe('Milk');
});


it('ranks exact matches, word prefixes, substrings, then typos like the web Select', () => {
  const names = ['Milx', 'Buttermilk', 'Milk powder', 'Milk'];
  const index = createFuzzySearch({ items: names, getSearchTerms: (name) => [name] });
  expect(index.search('milk').items).toEqual(['Milk', 'Milk powder', 'Buttermilk', 'Milx']);
});

it('keeps short and numeric terms literal while allowing typos in longer words', () => {
  const names = ['Milk 2%', 'Milk 3%', 'Soy Milk'];
  const chicken = createFuzzySearch({ items: ['Chicken 2', 'Chicken 3'], getSearchTerms: (name) => [name] });
  const index = createFuzzySearch({ items: names, getSearchTerms: (name) => [name] });
  expect(chicken.search('chiken 2').items).toEqual(['Chicken 2']);
  expect(index.search('mil 2').items).toEqual(['Milk 2%']);
  expect(index.search('so').items).toEqual(['Soy Milk']);
  expect(index.search('sx').items).toEqual([]);
});

it('normalizes Latin letters using the same deburr behavior as the web Select', () => {
  const index = createFuzzySearch({ items: ['Łódź', 'Crème fraîche'], getSearchTerms: (name) => [name] });
  expect(index.search('lodz').items).toEqual(['Łódź']);
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

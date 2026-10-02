/// <reference types="jest" />
import type { RecipeDTO, MealType } from '@/api/types';
import { createRecipeSearch } from './recipe-utils';

const recipe = (name: string, meal_types: MealType[]): RecipeDTO => ({
  id: name, name, meal_types, ingredients: [], time_in_minutes: 10, liked: false, notes: '',
});
const recipes = [recipe('Roast Chicken', ['dinner']), recipe('Chicken', ['lunch']), recipe('Omelette', ['breakfast'])];

it('keeps exact matches ahead of preferred meal ordering', () => {
  expect(createRecipeSearch(recipes, { mealType: 'dinner' }).search('chicken').map((r) => r.name))
    .toEqual(['Chicken', 'Roast Chicken']);
});
it('applies meal filters before matching', () => {
  expect(createRecipeSearch(recipes, { mealFilter: 'dinner' }).search('chiken')).toEqual([recipes[0]]);
});
it('retains normal sorting for a whitespace-only query', () => {
  expect(createRecipeSearch(recipes, { mealType: 'dinner' }).search('  ').map((r) => r.name))
    .toEqual(['Roast Chicken', 'Chicken', 'Omelette']);
});

it('preserves preferred meal ordering when fuzzy scores tie', () => {
  expect(createRecipeSearch(recipes, { mealType: 'dinner' }).search('chiken').map((r) => r.name))
    .toEqual(['Roast Chicken', 'Chicken']);
});

it('prepared recipe indexes preserve filters and preferred ordering across queries', () => {
  const index = createRecipeSearch(recipes, { mealType: 'dinner' });
  expect(index.search('')).toEqual([recipes[0], recipes[1], recipes[2]]);
  expect(index.search('chicken')).toEqual([recipes[1], recipes[0]]);
  expect(index.search('chiken')).toEqual([recipes[0], recipes[1]]);
  expect(index.search('unknown')).toEqual([]);
});

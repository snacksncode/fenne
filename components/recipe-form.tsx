import { RecipeDTO } from '@/api/types';
import { Button } from '@/components/button';
import { NotesEditor } from '@/components/notes-editor';
import { RecipeIngredients } from '@/components/recipe-ingredients';
import { Pancake } from '@/components/svgs/pancake';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useRecipeEditor } from '@/hooks/use-recipe-editor';
import { useNavigation } from 'expo-router/react-navigation';
import { ChevronLeft, Ham, Salad, CirclePlus, Save } from 'lucide-react-native';
import { View, StyleSheet, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', Icon: Pancake },
  { value: 'lunch', label: 'Lunch', Icon: Salad },
  { value: 'dinner', label: 'Dinner', Icon: Ham },
] as const;

export function RecipeForm({ recipe }: { recipe?: RecipeDTO }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { form, feedback, notesRef, editIngredient, removeIngredient } = useRecipeEditor(recipe);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          marginBottom: 16,
          marginLeft: -8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ChevronLeft />
        <Typography variant="heading-sm" weight="bold" color={colors.brown[900]}>
          {recipe ? 'Edit Recipe' : 'New Recipe'}
        </Typography>
      </Pressable>
      <KeyboardAwareScrollView
        ref={feedback.scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
        bottomOffset={150}
      >
        <form.AppForm>
          <View ref={feedback.contentRef} style={{ gap: 16 }}>
            <form.AppField name="name">
              {(field) => <field.TextField ref={feedback.inputRef('name')} autoFocus={!recipe?.name} label="Name" placeholder="e.g. Avocado Toast" />}
            </form.AppField>
            <form.AppField name="time_in_minutes">
              {(field) => <field.NumberField ref={feedback.inputRef('time_in_minutes')} label="Cooking time (in minutes)" placeholder="e.g. 30" />}
            </form.AppField>
            <form.AppField name="meal_types">
              {(field) => (
                <View>
                  <Typography variant="body-sm" weight="bold" color={colors.brown[900]} style={{ marginBottom: 4 }}>
                    Meal type
                  </Typography>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {mealTypes.map(({ value, label, Icon }) => (
                      <Button
                        key={value}
                        onPress={() => field.handleChange(
                          field.state.value.includes(value)
                            ? field.state.value.filter((type) => type !== value)
                            : [...field.state.value, value]
                        )}
                        leftIcon={{ Icon }}
                        text={label}
                        variant={field.state.value.includes(value) ? 'primary' : 'outlined'}
                        size="small"
                        style={{ flex: 1 }}
                      />
                    ))}
                  </View>
                  <field.Error ref={feedback.controlRef('meal_types')} />
                </View>
              )}
            </form.AppField>
            <form.AppField name="ingredients">
              {(field) => (
                <View>
                  <Typography variant="body-sm" weight="bold" color={colors.brown[900]} style={{ marginBottom: 4 }}>
                    Ingredients
                  </Typography>
                  <RecipeIngredients
                    ingredients={field.state.value}
                    handleAddIngredient={() => editIngredient()}
                    onIngredientEdit={editIngredient}
                    onIngredientDelete={removeIngredient}
                    onIngredientsReorder={field.handleChange}
                  />
                  <Button
                    text="Add ingredient"
                    variant="outlined"
                    leftIcon={{ Icon: CirclePlus }}
                    onPress={() => editIngredient()}
                    style={{ marginTop: 8 }}
                  />
                  <field.Error ref={feedback.controlRef('ingredients')} />
                </View>
              )}
            </form.AppField>
            <View>
              <Typography variant="body-sm" weight="bold" color={colors.brown[900]} style={{ marginBottom: 4 }}>
                Notes
              </Typography>
              <NotesEditor ref={notesRef} defaultValue={recipe?.notes} />
            </View>
          </View>
        </form.AppForm>
      </KeyboardAwareScrollView>
      <View
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          marginHorizontal: -20,
          paddingHorizontal: 20,
          borderTopWidth: 1,
          borderColor: colors.brown[800],
        }}
      >
        <form.AppForm>
          <form.Error message={feedback.error} />
          <form.SubmitButton text="Save recipe" variant="primary" leftIcon={{ Icon: Save }} />
        </form.AppForm>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.cream[100], flex: 1, paddingHorizontal: 20 },
});

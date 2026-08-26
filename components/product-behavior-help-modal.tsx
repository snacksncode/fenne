import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { BellRing, CookingPot, Lightbulb, LucideIcon, Scale, X } from 'lucide-react-native';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const modes: {
  title: string;
  Icon: LucideIcon;
  paragraphs: string[];
  example: string;
}[] = [
  {
    title: 'Track stock',
    Icon: Scale,
    paragraphs: [
      'Choose this when you want Fenne to keep a real pantry amount. Pick the unit printed on the package. If it’s a 500 g pack, choose grams; if it’s 16 oz, choose ounces. Buying items one by one? Choose pieces.',
      'Fenne adds up what your recipes need, checks what you already have, and puts only the missing amount on your grocery list. As meals are consumed, it subtracts what each recipe used from your pantry.',
    ],
    example: 'For example: chicken tracked in grams, rice tracked in kilograms or ounces, or eggs tracked as pieces.',
  },
  {
    title: 'Reminder',
    Icon: BellRing,
    paragraphs: [
      'Choose this when an exact amount would be annoying to maintain, but you still want a nudge to buy more.',
      'Tell Fenne how often you usually restock it. Shortly before that time, it will appear as “probably running low” when you generate groceries. You can then choose whether to add it to your list.',
    ],
    example: 'For example: coffee, pet food, or dishwasher tablets that you tend to replace on a regular schedule.',
  },
  {
    title: 'Kitchen basic',
    Icon: CookingPot,
    paragraphs: [
      'Choose this for things you normally assume are already at home, like salt or cooking oil.',
      'You can still use the item in recipes, but Fenne won’t track an amount, subtract anything from your pantry, or add it to generated grocery lists.',
    ],
    example: 'For example: salt, pepper, cooking oil, or other staples you rarely run out of.',
  },
];

export const ProductBehaviorHelpModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.intro}>
          <Typography variant="heading-md" weight="bold">
            How tracking works
          </Typography>
          <Typography variant="body-sm" weight="medium" color={colors.brown[900]}>
            Pick the option that matches how you want to manage this shopping item.
          </Typography>
        </View>
        <PressableWithHaptics
          accessibilityRole="button"
          accessibilityLabel="Close shopping item tracking help"
          onPress={onClose}
          style={styles.closeButton}
        >
          <X size={22} color={colors.brown[900]} />
        </PressableWithHaptics>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {modes.map(({ title, Icon, paragraphs, example }) => (
          <View key={title} style={styles.mode}>
            <View style={styles.modeHeader}>
              <View style={styles.icon}>
                <Icon size={24} strokeWidth={2.25} color={colors.orange[600]} />
              </View>
              <Typography variant="body-base" weight="bold">
                {title}
              </Typography>
            </View>
            <View style={styles.copy}>
              {paragraphs.map((paragraph) => (
                <Typography key={paragraph} variant="body-sm" weight="regular" color={colors.brown[900]}>
                  {paragraph}
                </Typography>
              ))}
              <View style={styles.example}>
                <Lightbulb size={16} strokeWidth={2.25} color={colors.orange[600]} />
                <Typography variant="body-sm" weight="medium" color={colors.brown[900]} style={styles.exampleCopy}>
                  {example}
                </Typography>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface.canvas,
    flex: 1,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  intro: {
    flex: 1,
    gap: 6,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.cream[50],
    borderColor: colors.border.muted,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  content: {
    gap: 28,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  mode: {
    gap: 10,
  },
  modeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.orange[100],
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    gap: 8,
  },
  example: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
  },
  exampleCopy: {
    flex: 1,
  },
});

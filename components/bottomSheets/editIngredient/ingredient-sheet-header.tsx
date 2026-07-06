import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { ArrowLeft } from 'lucide-react-native';
import { View } from 'react-native';

type IngredientSheetHeaderProps = {
  canGoBack: boolean;
  onBack: () => void;
  title: string;
};

export const IngredientSheetHeader = ({ canGoBack, onBack, title }: IngredientSheetHeaderProps) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
    {canGoBack && (
      <Button
        size="small"
        variant="outlined"
        leftIcon={{ Icon: ArrowLeft }}
        onPress={onBack}
        style={{ paddingHorizontal: 0, width: 42 }}
      />
    )}
    <Typography variant="heading-sm" weight="bold">
      {title}
    </Typography>
  </View>
);

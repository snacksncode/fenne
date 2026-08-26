import { productDeleteBlockersFromError } from '@/api/errors';
import { useDeleteProduct } from '@/api/products';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SheetAction } from '@/components/sheet-action';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { BookOpen, Edit2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

export const ProductOptionsSheet = (props: SheetProps<'product-options-sheet'>) => {
  const sheets = useSheets();
  const deleteProduct = useDeleteProduct();
  const [error, setError] = useState<string | null>(null);
  const { product } = props.data;

  const openUsages = async () => {
    await sheets.dismiss(props.sheetId);
    sheets.present('product-usages-sheet', { data: { product } });
  };

  const removeProduct = () => {
    if (deleteProduct.isPending) return;
    setError(null);
    deleteProduct.mutate(
      { id: product.id },
      {
        onSuccess: () => sheets.dismiss(props.sheetId),
        onError: async (mutationError) => {
          const blockers = productDeleteBlockersFromError(mutationError);
          if (!blockers) {
            setError('This shopping item could not be removed. Please try again.');
            return;
          }

          await sheets.dismiss(props.sheetId);
          sheets.present('product-usages-sheet', { data: { product, blockers } });
        },
      }
    );
  };

  return (
    <BaseSheet id={props.sheetId} dismissible={!deleteProduct.isPending} draggable={!deleteProduct.isPending}>
      <View style={{ marginBottom: 24 }}>
        <ShoppingItemIdentity name={product.name} aisle={product.aisle} />
      </View>
      <View style={{ gap: 12, marginBottom: 12 }}>
        <SheetAction
          text="Edit"
          icon={Edit2}
          onPress={async () => {
            await sheets.dismiss(props.sheetId);
            sheets.present('product-edit-sheet', { data: { product } });
          }}
        />
        <SheetAction text="See where it’s used" icon={BookOpen} onPress={openUsages} />
        <SheetAction text={deleteProduct.isPending ? 'Removing…' : 'Remove'} icon={Trash2} tone="danger" onPress={removeProduct} />
        {error ? (
          <Typography variant="body-sm" weight="medium" color={colors.red[600]}>
            {error}
          </Typography>
        ) : null}
      </View>
    </BaseSheet>
  );
};

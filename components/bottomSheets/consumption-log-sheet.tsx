import { useDeleteConsumptionLog } from '@/api/consumption-logs';
import { ConsumptionDeductionDTO, ConsumptionLogDTO } from '@/api/types';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { prettyUnit } from '@/utils/unit-formatters';
import { format, parseISO } from 'date-fns';
import { RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const mealLabels: Record<ConsumptionLogDTO['meal_type'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const deductionLabel = (deduction: ConsumptionDeductionDTO) => {
  const quantity = deduction.actually_deducted;
  const unit = deduction.product_unit ? ` ${prettyUnit({ quantity, unit: deduction.product_unit })}` : '';
  return `${quantity}${unit}`;
};

const warningFromMeta = (meta: unknown) => {
  if (meta && typeof meta === 'object' && 'warning' in meta && typeof meta.warning === 'string') {
    return meta.warning;
  }

  return null;
};

type ConsumptionLogSheetContentProps = {
  sheetId: SheetProps<'consumption-log-sheet'>['sheetId'];
  log: ConsumptionLogDTO;
};

const ConsumptionLogSheetContent = ({ sheetId, log }: ConsumptionLogSheetContentProps) => {
  const sheets = useSheets();
  const deleteConsumptionLog = useDeleteConsumptionLog();
  const [warning, setWarning] = useState<string | null>(null);
  const deducted = log.deductions.filter((deduction) => deduction.actually_deducted > 0);

  const handleUndo = () => {
    setWarning(null);
    deleteConsumptionLog.mutate(
      { id: log.id },
      {
        onSuccess: (response) => {
          const restoreWarning = warningFromMeta(response.meta);
          if (restoreWarning) {
            setWarning(restoreWarning);
            return;
          }

          sheets.dismiss(sheetId);
        },
      }
    );
  };

  return (
    <BaseSheet
      id={sheetId}
      footer={sheetFooter.buttonRow(
        <Button
          text="Undo consumption"
          variant="outlined"
          leftIcon={{ Icon: RotateCcw }}
          onPress={handleUndo}
          isLoading={deleteConsumptionLog.isPending}
        />
      )}
    >
      <View style={styles.header}>
        <Typography variant="heading-sm" weight="bold">
          {log.recipe_name || 'Unknown recipe'}
        </Typography>
        <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
          {mealLabels[log.meal_type]} · {format(parseISO(log.schedule_date), 'd MMM yyyy')}
        </Typography>
      </View>

      <View style={styles.section}>
        <Typography variant="body-sm" weight="bold">
          Pantry deductions
        </Typography>
        {deducted.length > 0 ? (
          <View style={styles.deductionList}>
            {deducted.map((deduction) => (
              <View key={`${deduction.product_id}-${deduction.product_unit}`} style={styles.deductionRow}>
                <View style={{ flex: 1 }}>
                  <Typography variant="body-base" weight="bold" numberOfLines={1}>
                    {deduction.product_name ?? 'Shopping item'}
                  </Typography>
                  <Typography variant="body-xs" weight="regular" color={colors.brown[700]} style={{ marginTop: -4 }}>
                    Restored if you undo
                  </Typography>
                </View>
                <Typography variant="body-base" weight="black" color={colors.brown[900]}>
                  {deductionLabel(deduction)}
                </Typography>
              </View>
            ))}
          </View>
        ) : (
          <Typography variant="body-sm" weight="regular" color={colors.brown[700]}>
            No pantry stock was deducted for this meal.
          </Typography>
        )}
      </View>

      {warning ? (
        <View style={styles.warning}>
          <Typography variant="body-sm" weight="bold" color={colors.orange[600]}>
            Pantry restore warning
          </Typography>
          <Typography variant="body-xs" weight="regular" color={colors.brown[700]}>
            {warning}
          </Typography>
        </View>
      ) : null}
    </BaseSheet>
  );
};

export const ConsumptionLogSheet = (props: SheetProps<'consumption-log-sheet'>) => {
  return <ConsumptionLogSheetContent sheetId={props.sheetId} log={props.data.log} />;
};

const styles = StyleSheet.create({
  header: {
    gap: 2,
    marginBottom: 20,
  },
  section: {
    gap: 10,
  },
  deductionList: {
    gap: 8,
  },
  deductionRow: {
    alignItems: 'center',
    backgroundColor: '#FEF2DD',
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 12,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warning: {
    backgroundColor: '#FFF4D6',
    borderColor: colors.orange[600],
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    marginTop: 16,
    padding: 12,
  },
});

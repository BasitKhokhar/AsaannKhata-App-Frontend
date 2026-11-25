import { CommonActions } from '@react-navigation/native';

function drawerNavigation(navigation) {
  return navigation.getParent()?.getParent();
}

export function resetToPos(navigation) {
  drawerNavigation(navigation)?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'BillingStack',
          state: {
            index: 0,
            routes: [{ name: 'NewBill' }],
          },
        },
      ],
    }),
  );
}

export function resetToRecordDetail(navigation, billId) {
  drawerNavigation(navigation)?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Records',
          state: {
            index: 1,
            routes: [
              { name: 'RecordsList' },
              { name: 'RecordDetail', params: { billId, fromCheckout: true } },
            ],
          },
        },
      ],
    }),
  );
}

export function resetToRecords(navigation) {
  drawerNavigation(navigation)?.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Records',
          state: {
            index: 0,
            routes: [{ name: 'RecordsList' }],
          },
        },
      ],
    }),
  );
}

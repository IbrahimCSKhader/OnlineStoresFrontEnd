import StoreContactAccounts from "../common/StoreContactAccounts.jsx";

export default function AdminContactAccounts({
  accounts = [],
  emptyLabel = "لا توجد حسابات تواصل بعد.",
}) {
  return (
    <StoreContactAccounts
      accounts={accounts}
      emptyLabel={emptyLabel}
      layout="compact"
      showTitle={false}
    />
  );
}

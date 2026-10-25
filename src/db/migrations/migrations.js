// Explicit migration imports are required for Expo/React Native SQLite.
import journal from './meta/_journal.json';
import m0000 from './0000_salty_shriek.sql';
import m0001 from './0001_loud_george_stacy.sql';
import m0002 from './0002_bill_payment_method.sql';
import m0003 from './0003_expenses.sql';
import m0004 from './0004_greedy_gauntlet.sql';
import m0005 from './0005_thankful_piledriver.sql';

export default {
  journal,
  migrations: { m0000, m0001, m0002, m0003, m0004, m0005 },
};

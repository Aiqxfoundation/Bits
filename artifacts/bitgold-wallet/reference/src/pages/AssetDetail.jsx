import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Pickaxe, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useAppData } from '@/components/AppLayout';
import { useToast } from '@/components/ui/use-toast';
import { getAsset, BTG_USDT_RATE } from '@/components/wallet/assets';
import TokenIcon from '@/components/wallet/TokenIcon';
import WithdrawDialog from '@/components/wallet/WithdrawDialog';
import ReceiveSheet from '@/components/wallet/ReceiveSheet';
import TransferSheet from '@/components/wallet/TransferSheet';

const TYPE_META = {
  claim: { icon: Pickaxe, label: 'Mining claim', positive: true },
  referral_bonus_l1: { icon: Users, label: 'Referral bonus · L1', positive: true },
  referral_bonus_l2: { icon: Users, label: 'Referral bonus · L2', positive: true },
  withdrawal: { icon: ArrowUpRight, label: 'Withdrawal', positive: false },
};

export default function AssetDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading, reload } = useAppData();
  const asset = getAsset(symbol);
  const [txs, setTxs] = useState([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const loadTxs = () => {
    base44.entities.Transaction.filter({}, { sort: '-created_date', limit: 50 })
      .then((r) => setTxs(r.items || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (profile) loadTxs();
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-muted-foreground">Asset not found.</p>
        <Link to="/app/wallet" className="text-gold underline mt-3 inline-block">Back to wallet</Link>
      </div>
    );
  }

  const supported = asset.kind === 'btg';
  const balance = supported ? Number(profile.balance || 0) : 0;
  const usdValue = balance * BTG_USDT_RATE;
  const list = supported ? (txs || []).slice(0, 50) : [];

  const comingSoon = () =>
    toast({ title: `${asset.symbol} actions coming soon`, description: 'This asset is display-only for now.' });

  const onDeposit = () => (supported ? setReceiveOpen(true) : comingSoon());
  const onWithdraw = () => (supported ? setWithdrawOpen(true) : comingSoon());
  const onTransfer = () => (supported ? setTransferOpen(true) : comingSoon());

  return (
    <div className="px-4 py-4 pb-24">
      <button
        onClick={() => navigate('/app/wallet')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Wallet
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card-gradient p-6 mb-5">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center text-center">
          <TokenIcon kind={asset.kind} size={56} />
          <h1 className="font-heading text-xl font-bold mt-3">{asset.name}</h1>
          <p className="text-xs text-muted-foreground">{asset.symbol}</p>
          <div className="font-heading text-4xl font-bold tabular-nums mt-4 leading-none">
            {balance.toFixed(4)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{asset.symbol}</div>
          {supported && (
            <div className="text-sm text-muted-foreground mt-1 tabular-nums">
              ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <button
          onClick={onDeposit}
          className="flex flex-col items-center gap-2 group"
        >
          <span className="w-12 h-12 rounded-2xl bg-gradient-gold text-black flex items-center justify-center group-hover:opacity-90 transition-opacity">
            <ArrowDownToLine className="w-5 h-5" />
          </span>
          <span className="text-xs font-medium">Deposit</span>
        </button>
        <button
          onClick={onWithdraw}
          className="flex flex-col items-center gap-2 group"
        >
          <span className="w-12 h-12 rounded-2xl bg-secondary border border-border text-gold flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
            <ArrowUpFromLine className="w-5 h-5" />
          </span>
          <span className="text-xs font-medium">Withdraw</span>
        </button>
        <button
          onClick={onTransfer}
          className="flex flex-col items-center gap-2 group"
        >
          <span className="w-12 h-12 rounded-2xl bg-secondary border border-border text-gold flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
            <ArrowLeftRight className="w-5 h-5" />
          </span>
          <span className="text-xs font-medium">Transfer</span>
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">Records</p>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-6 text-center">No records yet</p>
        ) : (
          list.map((tx) => {
            const meta = TYPE_META[tx.type] || { icon: ArrowDownLeft, label: tx.type, positive: Number(tx.amount) >= 0 };
            const Icon = meta.icon;
            const amount = Number(tx.amount || 0);
            return (
              <div key={tx.id} className="flex items-center gap-3 px-1 py-3">
                <span className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gold" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {tx.created_date ? formatDistanceToNow(new Date(tx.created_date), { addSuffix: true }) : ''}
                  </div>
                </div>
                <div className={`text-sm font-semibold tabular-nums shrink-0 ${meta.positive ? 'text-success' : 'text-foreground'}`}>
                  {meta.positive ? '+' : ''}
                  {amount.toFixed(4)} BTG
                </div>
              </div>
            );
          })
        )}
      </div>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        balance={balance}
        onSuccess={() => {
          reload();
          loadTxs();
        }}
      />
      <ReceiveSheet open={receiveOpen} onOpenChange={setReceiveOpen} profile={profile} />
      <TransferSheet open={transferOpen} onOpenChange={setTransferOpen} balance={balance} />
    </div>
  );
}
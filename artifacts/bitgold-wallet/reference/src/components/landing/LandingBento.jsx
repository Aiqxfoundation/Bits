import SectionHeading from './SectionHeading';
import BentoMining from './BentoMining';
import BentoNetwork from './BentoNetwork';
import BentoCustody from './BentoCustody';
import BentoPayments from './BentoPayments';

export default function LandingBento() {
  return (
    <section id="protocol" className="py-24 sm:py-32 px-5">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="The protocol"
          title={<>One network. <span className="font-display italic font-normal text-gradient-gold">Every move.</span></>}
          desc="Earn, hold and spend BTG from a single app — engineered with the rigor of a financial protocol."
        />
        <div className="grid md:grid-cols-3 gap-4">
          <BentoMining className="md:col-span-2" />
          <BentoNetwork />
          <BentoCustody />
          <BentoPayments className="md:col-span-2" />
        </div>
      </div>
    </section>
  );
}
namespace :sync do
  desc "Backfill transactions from Open Finance for a date range"
  task :backfill, [:user_email, :from, :to] => :environment do |_t, args|
    user = User.find_by!(email: args[:user_email])
    log = Sync::Orchestrator.new(user, from: args[:from], to: args[:to]).call
    puts "Sync completed: #{log.transactions_created} created, #{log.transactions_updated} updated, #{log.transactions_skipped} skipped"
  end
end

namespace :installments do
  desc "Backfill installment fields from raw_data and project future installments"
  task backfill: :environment do
    updated = backfill_installment_fields
    projected = project_future_installments

    puts "Updated #{updated} transactions with installment data"
    puts "Created #{projected} projected installments"
  end

  def backfill_installment_fields
    updated = 0

    Transaction.where(installment_number: nil)
               .where("raw_data->'creditCardMetadata'->>'totalInstallments' IS NOT NULL")
               .find_each do |tx|
      meta = tx.raw_data["creditCardMetadata"]
      purchase_date = Date.parse(meta["purchaseDate"])

      tx.update!(
        installment_number: meta["installmentNumber"],
        total_installments: meta["totalInstallments"],
        purchase_date: purchase_date,
        purchase_key: Transaction.generate_purchase_key(
          account_id: tx.account_id,
          purchase_date: purchase_date,
          amount: tx.amount
        )
      )
      updated += 1
    end

    updated
  end

  def project_future_installments
    projected = 0

    purchase_keys = Transaction.where.not(purchase_key: nil)
                               .not_projected
                               .group(:purchase_key)
                               .having("MAX(installment_number) < MAX(total_installments)")
                               .pluck(:purchase_key)

    purchase_keys.each do |key|
      latest = Transaction.where(purchase_key: key)
                          .not_projected
                          .order(installment_number: :desc)
                          .first
      next unless latest

      before_count = Transaction.where(purchase_key: key, status: "PROJECTED").count
      latest.project_future_installments!
      projected += Transaction.where(purchase_key: key, status: "PROJECTED").count - before_count
    end

    projected
  end
end

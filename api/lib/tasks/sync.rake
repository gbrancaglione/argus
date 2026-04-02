namespace :sync do
  desc "Backfill transactions from Open Finance for a date range"
  task :backfill, [:user_email, :from, :to] => :environment do |_t, args|
    user = User.find_by!(email: args[:user_email])
    log = Sync::Orchestrator.new(user, from: args[:from], to: args[:to]).call
    puts "Sync completed: #{log.transactions_created} created, #{log.transactions_updated} updated, #{log.transactions_skipped} skipped"
  end
end

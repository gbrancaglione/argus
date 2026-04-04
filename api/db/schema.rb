# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_04_011241) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "accounts", force: :cascade do |t|
    t.string "account_subtype"
    t.string "account_type", null: false
    t.decimal "balance", precision: 12, scale: 2
    t.datetime "created_at", null: false
    t.string "currency_code", default: "BRL"
    t.string "external_id", null: false
    t.string "item_id", null: false
    t.string "name", null: false
    t.jsonb "raw_data", default: {}
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["account_type"], name: "index_accounts_on_account_type"
    t.index ["user_id", "external_id"], name: "index_accounts_on_user_id_and_external_id", unique: true
    t.index ["user_id"], name: "index_accounts_on_user_id"
  end

  create_table "labels", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "name"], name: "index_labels_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_labels_on_user_id"
  end

  create_table "sync_logs", force: :cascade do |t|
    t.integer "accounts_synced", default: 0
    t.string "approval_status", default: "pending", null: false
    t.datetime "approved_at"
    t.datetime "created_at", null: false
    t.text "error_message"
    t.datetime "finished_at"
    t.date "from_date", null: false
    t.datetime "started_at", null: false
    t.string "status", default: "running", null: false
    t.date "to_date", null: false
    t.integer "transactions_created", default: 0
    t.integer "transactions_skipped", default: 0
    t.integer "transactions_updated", default: 0
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "started_at"], name: "index_sync_logs_on_user_id_and_started_at"
    t.index ["user_id"], name: "index_sync_logs_on_user_id"
  end

  create_table "transactions", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.decimal "amount_brl", precision: 12, scale: 2
    t.boolean "category_edited", default: false, null: false
    t.datetime "created_at", null: false
    t.string "currency_code", default: "BRL"
    t.date "date", null: false
    t.datetime "deleted_at"
    t.string "description"
    t.string "external_id", null: false
    t.integer "installment_number"
    t.bigint "label_id"
    t.string "original_category"
    t.string "payment_method"
    t.date "purchase_date"
    t.string "purchase_key"
    t.jsonb "raw_data", default: {}
    t.string "status"
    t.string "sync_action"
    t.bigint "sync_log_id"
    t.integer "total_installments"
    t.string "transaction_type", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "date"], name: "index_transactions_on_account_id_and_date"
    t.index ["account_id", "purchase_key", "installment_number"], name: "idx_transactions_installment_lookup"
    t.index ["account_id"], name: "index_transactions_on_account_id"
    t.index ["deleted_at"], name: "index_transactions_on_deleted_at"
    t.index ["external_id"], name: "index_transactions_on_external_id", unique: true
    t.index ["label_id"], name: "index_transactions_on_label_id"
    t.index ["purchase_key"], name: "index_transactions_on_purchase_key"
    t.index ["sync_log_id", "sync_action"], name: "index_transactions_on_sync_log_id_and_sync_action"
    t.index ["sync_log_id"], name: "index_transactions_on_sync_log_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "accounts", "users"
  add_foreign_key "labels", "users"
  add_foreign_key "sync_logs", "users"
  add_foreign_key "transactions", "accounts"
  add_foreign_key "transactions", "labels"
  add_foreign_key "transactions", "sync_logs"
end

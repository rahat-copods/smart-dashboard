export const userSchemas: any = {
  user01: {
    user_id: "user01",
    db_url:
      "d4e3ba0b561f99219c1b56c25cf4f3d4a9f5d48aeb3b21ee4a263b6f51e205acb0658722015b15fdc4170a5b7dc16e50d2e85b374b27633fc95690ee89b30d13:5a6d5f73ea2c5dc4adba1d959008bed5",
    schema: {
      actor: {
        columns: [
          {
            name: "actor_id",
            type: "INTEGER",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "first_name",
            type: "CHARACTER VARYING",
          },
          {
            name: "last_name",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [],
      },
      actor_info: {
        columns: [
          {
            name: "actor_id",
            type: "INTEGER",
          },
          {
            name: "first_name",
            type: "CHARACTER VARYING",
          },
          {
            name: "last_name",
            type: "CHARACTER VARYING",
          },
          {
            name: "film_info",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      customer_list: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "sid",
            type: "SMALLINT",
          },
          {
            name: "address",
            type: "CHARACTER VARYING",
          },
          {
            name: "zip code",
            type: "CHARACTER VARYING",
          },
          {
            name: "phone",
            type: "CHARACTER VARYING",
          },
          {
            name: "city",
            type: "CHARACTER VARYING",
          },
          {
            name: "country",
            type: "CHARACTER VARYING",
          },
          {
            name: "notes",
            type: "TEXT",
          },
          {
            name: "name",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      film_list: {
        columns: [
          {
            name: "fid",
            type: "INTEGER",
          },
          {
            name: "price",
            type: "NUMERIC",
          },
          {
            name: "length",
            type: "SMALLINT",
          },
          {
            name: "rating",
            type: "USER-DEFINED",
          },
          {
            name: "actors",
            type: "TEXT",
          },
          {
            name: "title",
            type: "CHARACTER VARYING",
          },
          {
            name: "description",
            type: "TEXT",
          },
          {
            name: "category",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [],
      },
      nicer_but_slower_film_list: {
        columns: [
          {
            name: "fid",
            type: "INTEGER",
          },
          {
            name: "price",
            type: "NUMERIC",
          },
          {
            name: "length",
            type: "SMALLINT",
          },
          {
            name: "rating",
            type: "USER-DEFINED",
          },
          {
            name: "actors",
            type: "TEXT",
          },
          {
            name: "title",
            type: "CHARACTER VARYING",
          },
          {
            name: "description",
            type: "TEXT",
          },
          {
            name: "category",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [],
      },
      sales_by_film_category: {
        columns: [
          {
            name: "total_sales",
            type: "NUMERIC",
          },
          {
            name: "category",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [],
      },
      store: {
        columns: [
          {
            name: "store_id",
            type: "INTEGER",
          },
          {
            name: "manager_staff_id",
            type: "SMALLINT",
          },
          {
            name: "address_id",
            type: "SMALLINT",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "address_id",
            foreign_table: "address",
            foreign_column: "address_id",
          },
          {
            column: "manager_staff_id",
            foreign_table: "staff",
            foreign_column: "staff_id",
          },
        ],
      },
      sales_by_store: {
        columns: [
          {
            name: "total_sales",
            type: "NUMERIC",
          },
          {
            name: "store",
            type: "TEXT",
          },
          {
            name: "manager",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      staff_list: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "sid",
            type: "SMALLINT",
          },
          {
            name: "address",
            type: "CHARACTER VARYING",
          },
          {
            name: "zip code",
            type: "CHARACTER VARYING",
          },
          {
            name: "phone",
            type: "CHARACTER VARYING",
          },
          {
            name: "city",
            type: "CHARACTER VARYING",
          },
          {
            name: "country",
            type: "CHARACTER VARYING",
          },
          {
            name: "name",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      address: {
        columns: [
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "city_id",
            type: "SMALLINT",
          },
          {
            name: "address_id",
            type: "INTEGER",
          },
          {
            name: "district",
            type: "CHARACTER VARYING",
          },
          {
            name: "phone",
            type: "CHARACTER VARYING",
          },
          {
            name: "postal_code",
            type: "CHARACTER VARYING",
          },
          {
            name: "address",
            type: "CHARACTER VARYING",
          },
          {
            name: "address2",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [
          {
            column: "city_id",
            foreign_table: "city",
            foreign_column: "city_id",
          },
        ],
      },
      category: {
        columns: [
          {
            name: "category_id",
            type: "INTEGER",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "name",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [],
      },
      city: {
        columns: [
          {
            name: "city_id",
            type: "INTEGER",
          },
          {
            name: "country_id",
            type: "SMALLINT",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "city",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [
          {
            column: "country_id",
            foreign_table: "country",
            foreign_column: "country_id",
          },
        ],
      },
      country: {
        columns: [
          {
            name: "country_id",
            type: "INTEGER",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "country",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [],
      },
      customer: {
        columns: [
          {
            name: "active",
            type: "INTEGER",
          },
          {
            name: "store_id",
            type: "SMALLINT",
          },
          {
            name: "create_date",
            type: "DATE",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "customer_id",
            type: "INTEGER",
          },
          {
            name: "address_id",
            type: "SMALLINT",
          },
          {
            name: "activebool",
            type: "BOOLEAN",
          },
          {
            name: "first_name",
            type: "CHARACTER VARYING",
          },
          {
            name: "last_name",
            type: "CHARACTER VARYING",
          },
          {
            name: "email",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [
          {
            column: "address_id",
            foreign_table: "address",
            foreign_column: "address_id",
          },
        ],
      },
      film_actor: {
        columns: [
          {
            name: "actor_id",
            type: "SMALLINT",
          },
          {
            name: "film_id",
            type: "SMALLINT",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "actor_id",
            foreign_table: "actor",
            foreign_column: "actor_id",
          },
          {
            column: "film_id",
            foreign_table: "film",
            foreign_column: "film_id",
          },
        ],
      },
      film_category: {
        columns: [
          {
            name: "film_id",
            type: "SMALLINT",
          },
          {
            name: "category_id",
            type: "SMALLINT",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "category_id",
            foreign_table: "category",
            foreign_column: "category_id",
          },
          {
            column: "film_id",
            foreign_table: "film",
            foreign_column: "film_id",
          },
        ],
      },
      inventory: {
        columns: [
          {
            name: "inventory_id",
            type: "INTEGER",
          },
          {
            name: "film_id",
            type: "SMALLINT",
          },
          {
            name: "store_id",
            type: "SMALLINT",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "film_id",
            foreign_table: "film",
            foreign_column: "film_id",
          },
        ],
      },
      language: {
        columns: [
          {
            name: "language_id",
            type: "INTEGER",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "name",
            type: "CHARACTER",
          },
        ],
        relationships: [],
      },
      rental: {
        columns: [
          {
            name: "rental_id",
            type: "INTEGER",
          },
          {
            name: "rental_date",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "inventory_id",
            type: "INTEGER",
          },
          {
            name: "customer_id",
            type: "SMALLINT",
          },
          {
            name: "return_date",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "staff_id",
            type: "SMALLINT",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "customer_id",
            foreign_table: "customer",
            foreign_column: "customer_id",
          },
          {
            column: "inventory_id",
            foreign_table: "inventory",
            foreign_column: "inventory_id",
          },
          {
            column: "staff_id",
            foreign_table: "staff",
            foreign_column: "staff_id",
          },
        ],
      },
      staff: {
        columns: [
          {
            name: "picture",
            type: "BYTEA",
          },
          {
            name: "address_id",
            type: "SMALLINT",
          },
          {
            name: "store_id",
            type: "SMALLINT",
          },
          {
            name: "active",
            type: "BOOLEAN",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "staff_id",
            type: "INTEGER",
          },
          {
            name: "first_name",
            type: "CHARACTER VARYING",
          },
          {
            name: "last_name",
            type: "CHARACTER VARYING",
          },
          {
            name: "password",
            type: "CHARACTER VARYING",
          },
          {
            name: "email",
            type: "CHARACTER VARYING",
          },
          {
            name: "username",
            type: "CHARACTER VARYING",
          },
        ],
        relationships: [
          {
            column: "address_id",
            foreign_table: "address",
            foreign_column: "address_id",
          },
        ],
      },
      payment: {
        columns: [
          {
            name: "payment_id",
            type: "INTEGER",
          },
          {
            name: "customer_id",
            type: "SMALLINT",
          },
          {
            name: "staff_id",
            type: "SMALLINT",
          },
          {
            name: "rental_id",
            type: "INTEGER",
          },
          {
            name: "amount",
            type: "NUMERIC",
          },
          {
            name: "payment_date",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "customer_id",
            foreign_table: "customer",
            foreign_column: "customer_id",
          },
          {
            column: "rental_id",
            foreign_table: "rental",
            foreign_column: "rental_id",
          },
          {
            column: "staff_id",
            foreign_table: "staff",
            foreign_column: "staff_id",
          },
        ],
      },
      film: {
        columns: [
          {
            name: "fulltext",
            type: "TSVECTOR",
          },
          {
            name: "rating",
            type: "USER-DEFINED",
          },
          {
            name: "last_update",
            type: "TIMESTAMP WITHOUT TIME ZONE",
          },
          {
            name: "film_id",
            type: "INTEGER",
          },
          {
            name: "release_year",
            type: "INTEGER",
          },
          {
            name: "language_id",
            type: "SMALLINT",
          },
          {
            name: "rental_duration",
            type: "SMALLINT",
          },
          {
            name: "rental_rate",
            type: "NUMERIC",
          },
          {
            name: "length",
            type: "SMALLINT",
          },
          {
            name: "replacement_cost",
            type: "NUMERIC",
          },
          {
            name: "title",
            type: "CHARACTER VARYING",
          },
          {
            name: "description",
            type: "TEXT",
          },
          {
            name: "special_features",
            type: "ARRAY",
          },
        ],
        relationships: [
          {
            column: "language_id",
            foreign_table: "language",
            foreign_column: "language_id",
          },
        ],
      },
    },
  },
  user04: {
    user_id: "user04",
    db_url:
      "0a341aea90d1d61c9cc1042185afcd977b83de661659e8522ff3818733325de3cc8b79d47a5322ae753f952996b050180b8aae29275a88a16da244b049722768:7b5113ee2544d15ed20f1cd03b462fae",
    schema: {
      patients: {
        columns: [
          {
            name: "age",
            type: "INTEGER",
          },
          {
            name: "Discharge Date",
            type: "DATE",
          },
          {
            name: "Billing Amount",
            type: "NUMERIC",
          },
          {
            name: "Date of Admission",
            type: "DATE",
          },
          {
            name: "doctor",
            type: "TEXT",
          },
          {
            name: "hospital",
            type: "TEXT",
          },
          {
            name: "Insurance Provider",
            type: "TEXT",
          },
          {
            name: "Room Number",
            type: "TEXT",
          },
          {
            name: "Admission Type",
            type: "TEXT",
          },
          {
            name: "medication",
            type: "TEXT",
          },
          {
            name: "name",
            type: "TEXT",
          },
          {
            name: "Test Results",
            type: "TEXT",
          },
          {
            name: "gender",
            type: "TEXT",
          },
          {
            name: "Blood Type",
            type: "TEXT",
          },
          {
            name: "Medical Condition",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
    },
  },
  user03: {
    user_id: "user03",
    db_url:
      "postgresql://postgres:admin@localhost:5432/hospital",
    schema: {
      appointments: {
        columns: [
          {
            name: "appointment_date",
            type: "DATE",
          },
          {
            name: "appointment_time",
            type: "TIME WITHOUT TIME ZONE",
          },
          {
            name: "doctor_id",
            type: "TEXT",
          },
          {
            name: "appointment_id",
            type: "TEXT",
          },
          {
            name: "status",
            type: "TEXT",
          },
          {
            name: "reason_for_visit",
            type: "TEXT",
          },
          {
            name: "patient_id",
            type: "TEXT",
          },
        ],
        relationships: [
          {
            column: "patient_id",
            foreign_table: "patients",
            foreign_column: "patient_id",
          },
          {
            column: "doctor_id",
            foreign_table: "doctors",
            foreign_column: "doctor_id",
          },
        ],
      },
      patients: {
        columns: [
          {
            name: "registration_date",
            type: "DATE",
          },
          {
            name: "date_of_birth",
            type: "DATE",
          },
          {
            name: "last_name",
            type: "TEXT",
          },
          {
            name: "gender",
            type: "CHARACTER",
          },
          {
            name: "contact_number",
            type: "TEXT",
          },
          {
            name: "address",
            type: "TEXT",
          },
          {
            name: "insurance_provider",
            type: "TEXT",
          },
          {
            name: "insurance_number",
            type: "TEXT",
          },
          {
            name: "patient_id",
            type: "TEXT",
          },
          {
            name: "email",
            type: "TEXT",
          },
          {
            name: "first_name",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      doctors: {
        columns: [
          {
            name: "years_experience",
            type: "INTEGER",
          },
          {
            name: "first_name",
            type: "TEXT",
          },
          {
            name: "last_name",
            type: "TEXT",
          },
          {
            name: "specialization",
            type: "TEXT",
          },
          {
            name: "phone_number",
            type: "TEXT",
          },
          {
            name: "hospital_branch",
            type: "TEXT",
          },
          {
            name: "doctor_id",
            type: "TEXT",
          },
          {
            name: "email",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      treatments: {
        columns: [
          {
            name: "cost",
            type: "NUMERIC",
          },
          {
            name: "treatment_date",
            type: "DATE",
          },
          {
            name: "treatment_id",
            type: "TEXT",
          },
          {
            name: "appointment_id",
            type: "TEXT",
          },
          {
            name: "treatment_type",
            type: "TEXT",
          },
          {
            name: "description",
            type: "TEXT",
          },
        ],
        relationships: [
          {
            column: "appointment_id",
            foreign_table: "appointments",
            foreign_column: "appointment_id",
          },
        ],
      },
      billing: {
        columns: [
          {
            name: "bill_date",
            type: "DATE",
          },
          {
            name: "amount",
            type: "NUMERIC",
          },
          {
            name: "treatment_id",
            type: "TEXT",
          },
          {
            name: "bill_id",
            type: "TEXT",
          },
          {
            name: "payment_status",
            type: "TEXT",
          },
          {
            name: "payment_method",
            type: "TEXT",
          },
          {
            name: "patient_id",
            type: "TEXT",
          },
        ],
        relationships: [
          {
            column: "patient_id",
            foreign_table: "patients",
            foreign_column: "patient_id",
          },
          {
            column: "treatment_id",
            foreign_table: "treatments",
            foreign_column: "treatment_id",
          },
        ],
      },
    },
  },
  user02: {
    user_id: "user02",
    db_url:
      "a919f04a5fe3c9b78f41378324f6c10cef38d5c510be57a5c8c51168941eed6ee065d209851678bd2fc6d8ff5027cf39b415c8690dd671dd556f2c6e45e08b1f:53a9d8459fb8456dd37209179aa159d7",
    schema: {
      public_table: {
        columns: [],
        relationships: [],
      },
      colors: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "name",
            type: "TEXT",
          },
          {
            name: "rgb",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      sizes: {
        columns: [
          {
            name: "size_eu",
            type: "INT4RANGE",
          },
          {
            name: "gender",
            type: "USER-DEFINED",
          },
          {
            name: "category",
            type: "USER-DEFINED",
          },
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "size_us",
            type: "INT4RANGE",
          },
          {
            name: "size_uk",
            type: "INT4RANGE",
          },
          {
            name: "size",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      order_positions: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "orderid",
            type: "INTEGER",
          },
          {
            name: "articleid",
            type: "INTEGER",
          },
          {
            name: "amount",
            type: "SMALLINT",
          },
          {
            name: "price",
            type: "MONEY",
          },
          {
            name: "created",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "updated",
            type: "TIMESTAMP WITH TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "articleid",
            foreign_table: "articles",
            foreign_column: "id",
          },
          {
            column: "orderid",
            foreign_table: "order",
            foreign_column: "id",
          },
        ],
      },
      products: {
        columns: [
          {
            name: "updated",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "labelid",
            type: "INTEGER",
          },
          {
            name: "category",
            type: "USER-DEFINED",
          },
          {
            name: "gender",
            type: "USER-DEFINED",
          },
          {
            name: "currentlyactive",
            type: "BOOLEAN",
          },
          {
            name: "created",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "name",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      stock: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "articleid",
            type: "INTEGER",
          },
          {
            name: "count",
            type: "INTEGER",
          },
          {
            name: "created",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "updated",
            type: "TIMESTAMP WITH TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "articleid",
            foreign_table: "articles",
            foreign_column: "id",
          },
        ],
      },
      articles: {
        columns: [
          {
            name: "updated",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "productid",
            type: "INTEGER",
          },
          {
            name: "created",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "colorid",
            type: "INTEGER",
          },
          {
            name: "size",
            type: "INTEGER",
          },
          {
            name: "originalprice",
            type: "MONEY",
          },
          {
            name: "reducedprice",
            type: "MONEY",
          },
          {
            name: "taxrate",
            type: "NUMERIC",
          },
          {
            name: "discountinpercent",
            type: "INTEGER",
          },
          {
            name: "currentlyactive",
            type: "BOOLEAN",
          },
          {
            name: "ean",
            type: "TEXT",
          },
          {
            name: "description",
            type: "TEXT",
          },
        ],
        relationships: [
          {
            column: "colorid",
            foreign_table: "colors",
            foreign_column: "id",
          },
        ],
      },
      labels: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "icon",
            type: "BYTEA",
          },
          {
            name: "name",
            type: "TEXT",
          },
          {
            name: "slugname",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      customer: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "currentaddressid",
            type: "INTEGER",
          },
          {
            name: "created",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "updated",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "gender",
            type: "USER-DEFINED",
          },
          {
            name: "dateofbirth",
            type: "DATE",
          },
          {
            name: "firstname",
            type: "TEXT",
          },
          {
            name: "lastname",
            type: "TEXT",
          },
          {
            name: "email",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      address: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "customerid",
            type: "INTEGER",
          },
          {
            name: "created",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "updated",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "address1",
            type: "TEXT",
          },
          {
            name: "address2",
            type: "TEXT",
          },
          {
            name: "city",
            type: "TEXT",
          },
          {
            name: "zip",
            type: "TEXT",
          },
          {
            name: "firstname",
            type: "TEXT",
          },
          {
            name: "lastname",
            type: "TEXT",
          },
        ],
        relationships: [],
      },
      order: {
        columns: [
          {
            name: "id",
            type: "INTEGER",
          },
          {
            name: "customer",
            type: "INTEGER",
          },
          {
            name: "ordertimestamp",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "shippingaddressid",
            type: "INTEGER",
          },
          {
            name: "total",
            type: "MONEY",
          },
          {
            name: "shippingcost",
            type: "MONEY",
          },
          {
            name: "created",
            type: "TIMESTAMP WITH TIME ZONE",
          },
          {
            name: "updated",
            type: "TIMESTAMP WITH TIME ZONE",
          },
        ],
        relationships: [
          {
            column: "shippingaddressid",
            foreign_table: "address",
            foreign_column: "id",
          },
        ],
      },
    },
  },
};

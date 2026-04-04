export const EMPLOYEES_SEED = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  budget REAL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  department_id INTEGER,
  salary REAL,
  hire_date TEXT,
  manager_id INTEGER,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  start_date TEXT,
  end_date TEXT,
  budget REAL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE employee_projects (
  employee_id INTEGER,
  project_id INTEGER,
  role TEXT,
  hours_worked REAL DEFAULT 0,
  PRIMARY KEY (employee_id, project_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

INSERT INTO departments VALUES (1, 'Engineering', 500000);
INSERT INTO departments VALUES (2, 'Marketing', 200000);
INSERT INTO departments VALUES (3, 'Sales', 300000);
INSERT INTO departments VALUES (4, 'HR', 150000);
INSERT INTO departments VALUES (5, 'Finance', 250000);

INSERT INTO employees VALUES (1, 'Alice', 'Johnson', 'alice@company.com', 1, 95000, '2020-03-15', NULL);
INSERT INTO employees VALUES (2, 'Bob', 'Smith', 'bob@company.com', 1, 88000, '2021-06-01', 1);
INSERT INTO employees VALUES (3, 'Carol', 'Williams', 'carol@company.com', 2, 72000, '2019-11-20', NULL);
INSERT INTO employees VALUES (4, 'David', 'Brown', 'david@company.com', 3, 68000, '2022-01-10', NULL);
INSERT INTO employees VALUES (5, 'Eva', 'Davis', 'eva@company.com', 1, 105000, '2018-07-22', NULL);
INSERT INTO employees VALUES (6, 'Frank', 'Miller', 'frank@company.com', 2, 65000, '2023-02-14', 3);
INSERT INTO employees VALUES (7, 'Grace', 'Wilson', 'grace@company.com', 3, 78000, '2020-09-05', 4);
INSERT INTO employees VALUES (8, 'Henry', 'Moore', 'henry@company.com', 4, 62000, '2021-12-01', NULL);
INSERT INTO employees VALUES (9, 'Iris', 'Taylor', 'iris@company.com', 5, 85000, '2019-04-18', NULL);
INSERT INTO employees VALUES (10, 'Jack', 'Anderson', 'jack@company.com', 1, 92000, '2020-08-30', 5);
INSERT INTO employees VALUES (11, 'Karen', 'Thomas', 'karen@company.com', 3, 71000, '2022-05-15', 4);
INSERT INTO employees VALUES (12, 'Leo', 'Jackson', 'leo@company.com', 2, 69000, '2023-07-01', 3);
INSERT INTO employees VALUES (13, 'Mia', 'White', 'mia@company.com', 5, 91000, '2020-01-20', 9);
INSERT INTO employees VALUES (14, 'Noah', 'Harris', 'noah@company.com', 4, 58000, '2023-09-10', 8);
INSERT INTO employees VALUES (15, 'Olivia', 'Martin', NULL, 1, 78000, '2022-11-25', 1);

INSERT INTO projects VALUES (1, 'Website Redesign', 1, '2024-01-01', '2024-06-30', 120000);
INSERT INTO projects VALUES (2, 'Mobile App', 1, '2024-03-01', '2024-12-31', 250000);
INSERT INTO projects VALUES (3, 'Q1 Campaign', 2, '2024-01-01', '2024-03-31', 50000);
INSERT INTO projects VALUES (4, 'Sales Portal', 3, '2024-02-01', '2024-08-31', 80000);
INSERT INTO projects VALUES (5, 'Employee Portal', 4, '2024-04-01', '2024-09-30', 60000);

INSERT INTO employee_projects VALUES (1, 1, 'Lead', 120);
INSERT INTO employee_projects VALUES (2, 1, 'Developer', 200);
INSERT INTO employee_projects VALUES (5, 2, 'Lead', 150);
INSERT INTO employee_projects VALUES (10, 2, 'Developer', 180);
INSERT INTO employee_projects VALUES (15, 1, 'Developer', 90);
INSERT INTO employee_projects VALUES (3, 3, 'Lead', 100);
INSERT INTO employee_projects VALUES (6, 3, 'Designer', 80);
INSERT INTO employee_projects VALUES (4, 4, 'Lead', 110);
INSERT INTO employee_projects VALUES (7, 4, 'Sales Rep', 95);
INSERT INTO employee_projects VALUES (11, 4, 'Sales Rep', 70);
INSERT INTO employee_projects VALUES (8, 5, 'Lead', 130);
INSERT INTO employee_projects VALUES (14, 5, 'Assistant', 60);
`;

export const ECOMMERCE_SEED = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  city TEXT,
  country TEXT,
  joined_date TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER DEFAULT 0
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  order_date TEXT,
  status TEXT DEFAULT 'pending',
  total REAL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  unit_price REAL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  product_id INTEGER,
  customer_id INTEGER,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  review_date TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

INSERT INTO customers VALUES (1, 'John Doe', 'john@email.com', 'New York', 'USA', '2023-01-15');
INSERT INTO customers VALUES (2, 'Jane Smith', 'jane@email.com', 'London', 'UK', '2023-03-20');
INSERT INTO customers VALUES (3, 'Pierre Dupont', 'pierre@email.com', 'Paris', 'France', '2023-02-10');
INSERT INTO customers VALUES (4, 'Maria Garcia', 'maria@email.com', 'Madrid', 'Spain', '2023-05-01');
INSERT INTO customers VALUES (5, 'Yuki Tanaka', 'yuki@email.com', 'Tokyo', 'Japan', '2023-04-12');
INSERT INTO customers VALUES (6, 'Emma Wilson', 'emma@email.com', 'Toronto', 'Canada', '2023-06-25');
INSERT INTO customers VALUES (7, 'Liam Brown', 'liam@email.com', 'Sydney', 'Australia', '2023-07-08');
INSERT INTO customers VALUES (8, 'Sofia Rossi', 'sofia@email.com', 'Rome', 'Italy', '2023-08-15');

INSERT INTO products VALUES (1, 'Laptop Pro', 'Electronics', 1299.99, 50);
INSERT INTO products VALUES (2, 'Wireless Mouse', 'Electronics', 29.99, 200);
INSERT INTO products VALUES (3, 'USB-C Hub', 'Electronics', 49.99, 150);
INSERT INTO products VALUES (4, 'Mechanical Keyboard', 'Electronics', 89.99, 100);
INSERT INTO products VALUES (5, 'Monitor 27"', 'Electronics', 399.99, 30);
INSERT INTO products VALUES (6, 'Desk Lamp', 'Office', 34.99, 80);
INSERT INTO products VALUES (7, 'Standing Desk', 'Office', 599.99, 25);
INSERT INTO products VALUES (8, 'Ergonomic Chair', 'Office', 449.99, 40);
INSERT INTO products VALUES (9, 'Notebook Set', 'Office', 12.99, 500);
INSERT INTO products VALUES (10, 'Webcam HD', 'Electronics', 79.99, 60);

INSERT INTO orders VALUES (1, 1, '2024-01-05', 'completed', 1379.97);
INSERT INTO orders VALUES (2, 2, '2024-01-12', 'completed', 489.98);
INSERT INTO orders VALUES (3, 3, '2024-01-20', 'completed', 29.99);
INSERT INTO orders VALUES (4, 1, '2024-02-03', 'completed', 139.98);
INSERT INTO orders VALUES (5, 4, '2024-02-14', 'shipped', 1299.99);
INSERT INTO orders VALUES (6, 5, '2024-02-28', 'completed', 699.98);
INSERT INTO orders VALUES (7, 6, '2024-03-05', 'completed', 89.99);
INSERT INTO orders VALUES (8, 2, '2024-03-15', 'pending', 449.99);
INSERT INTO orders VALUES (9, 7, '2024-03-20', 'completed', 47.98);
INSERT INTO orders VALUES (10, 8, '2024-03-25', 'shipped', 1749.98);

INSERT INTO order_items VALUES (1, 1, 1, 1, 1299.99);
INSERT INTO order_items VALUES (2, 1, 2, 1, 29.99);
INSERT INTO order_items VALUES (3, 1, 3, 1, 49.99);
INSERT INTO order_items VALUES (4, 2, 4, 1, 89.99);
INSERT INTO order_items VALUES (5, 2, 5, 1, 399.99);
INSERT INTO order_items VALUES (6, 3, 2, 1, 29.99);
INSERT INTO order_items VALUES (7, 4, 4, 1, 89.99);
INSERT INTO order_items VALUES (8, 4, 3, 1, 49.99);
INSERT INTO order_items VALUES (9, 5, 1, 1, 1299.99);
INSERT INTO order_items VALUES (10, 6, 7, 1, 599.99);
INSERT INTO order_items VALUES (11, 6, 10, 1, 79.99);
INSERT INTO order_items VALUES (12, 7, 4, 1, 89.99);
INSERT INTO order_items VALUES (13, 8, 8, 1, 449.99);
INSERT INTO order_items VALUES (14, 9, 9, 2, 12.99);
INSERT INTO order_items VALUES (15, 9, 6, 1, 34.99);
INSERT INTO order_items VALUES (16, 10, 1, 1, 1299.99);
INSERT INTO order_items VALUES (17, 10, 8, 1, 449.99);

INSERT INTO reviews VALUES (1, 1, 1, 5, 'Amazing laptop, very fast!', '2024-01-20');
INSERT INTO reviews VALUES (2, 2, 1, 4, 'Good mouse, comfortable grip', '2024-01-22');
INSERT INTO reviews VALUES (3, 4, 2, 5, 'Best keyboard ever!', '2024-01-25');
INSERT INTO reviews VALUES (4, 5, 2, 4, 'Great monitor, vivid colors', '2024-02-01');
INSERT INTO reviews VALUES (5, 1, 3, 4, 'Solid laptop, great battery', '2024-02-05');
INSERT INTO reviews VALUES (6, 7, 5, 5, 'Love this standing desk!', '2024-03-10');
INSERT INTO reviews VALUES (7, 4, 6, 3, 'Good but keys are a bit loud', '2024-03-12');
INSERT INTO reviews VALUES (8, 8, 7, 4, 'Very comfortable chair', '2024-03-18');
INSERT INTO reviews VALUES (9, 10, 5, 4, 'Clear image quality', '2024-03-22');
INSERT INTO reviews VALUES (10, 1, 8, 5, 'Perfect for work and gaming', '2024-03-28');
`;

export const MUSIC_SEED = `
CREATE TABLE artists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT,
  country TEXT,
  formed_year INTEGER
);

CREATE TABLE albums (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  artist_id INTEGER,
  release_year INTEGER,
  total_tracks INTEGER,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE tracks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  album_id INTEGER,
  track_number INTEGER,
  duration_seconds INTEGER,
  FOREIGN KEY (album_id) REFERENCES albums(id)
);

CREATE TABLE playlists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_date TEXT
);

CREATE TABLE playlist_tracks (
  playlist_id INTEGER,
  track_id INTEGER,
  position INTEGER,
  added_date TEXT,
  PRIMARY KEY (playlist_id, track_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id),
  FOREIGN KEY (track_id) REFERENCES tracks(id)
);

INSERT INTO artists VALUES (1, 'The Midnight', 'Synthwave', 'USA', 2012);
INSERT INTO artists VALUES (2, 'Daft Punk', 'Electronic', 'France', 1993);
INSERT INTO artists VALUES (3, 'Arctic Monkeys', 'Indie Rock', 'UK', 2002);
INSERT INTO artists VALUES (4, 'Tame Impala', 'Psychedelic Rock', 'Australia', 2007);
INSERT INTO artists VALUES (5, 'Khruangbin', 'Funk', 'USA', 2010);

INSERT INTO albums VALUES (1, 'Endless Summer', 1, 2016, 11);
INSERT INTO albums VALUES (2, 'Nocturnal', 1, 2017, 12);
INSERT INTO albums VALUES (3, 'Random Access Memories', 2, 2013, 13);
INSERT INTO albums VALUES (4, 'Discovery', 2, 2001, 14);
INSERT INTO albums VALUES (5, 'AM', 3, 2013, 12);
INSERT INTO albums VALUES (6, 'Tranquility Base Hotel', 3, 2018, 11);
INSERT INTO albums VALUES (7, 'Currents', 4, 2015, 13);
INSERT INTO albums VALUES (8, 'The Slow Rush', 4, 2020, 12);
INSERT INTO albums VALUES (9, 'Con Todo El Mundo', 5, 2018, 11);
INSERT INTO albums VALUES (10, 'Mordechai', 5, 2020, 10);

INSERT INTO tracks VALUES (1, 'Sunset', 1, 1, 245);
INSERT INTO tracks VALUES (2, 'Endless Summer', 1, 2, 312);
INSERT INTO tracks VALUES (3, 'Vampires', 2, 1, 278);
INSERT INTO tracks VALUES (4, 'Crystalline', 2, 3, 256);
INSERT INTO tracks VALUES (5, 'Get Lucky', 3, 8, 369);
INSERT INTO tracks VALUES (6, 'Instant Crush', 3, 5, 337);
INSERT INTO tracks VALUES (7, 'One More Time', 4, 1, 320);
INSERT INTO tracks VALUES (8, 'Digital Love', 4, 3, 301);
INSERT INTO tracks VALUES (9, 'Do I Wanna Know?', 5, 1, 272);
INSERT INTO tracks VALUES (10, 'R U Mine?', 5, 2, 201);
INSERT INTO tracks VALUES (11, 'Four Out of Five', 6, 4, 289);
INSERT INTO tracks VALUES (12, 'Let It Happen', 7, 1, 467);
INSERT INTO tracks VALUES (13, 'The Less I Know', 7, 7, 218);
INSERT INTO tracks VALUES (14, 'Lost In Yesterday', 8, 4, 244);
INSERT INTO tracks VALUES (15, 'Maria También', 9, 3, 234);
INSERT INTO tracks VALUES (16, 'Time (You and I)', 10, 1, 274);

INSERT INTO playlists VALUES (1, 'Chill Vibes', '2024-01-01');
INSERT INTO playlists VALUES (2, 'Workout Mix', '2024-01-15');
INSERT INTO playlists VALUES (3, 'Late Night', '2024-02-01');

INSERT INTO playlist_tracks VALUES (1, 2, 1, '2024-01-01');
INSERT INTO playlist_tracks VALUES (1, 5, 2, '2024-01-01');
INSERT INTO playlist_tracks VALUES (1, 13, 3, '2024-01-02');
INSERT INTO playlist_tracks VALUES (1, 15, 4, '2024-01-03');
INSERT INTO playlist_tracks VALUES (2, 7, 1, '2024-01-15');
INSERT INTO playlist_tracks VALUES (2, 9, 2, '2024-01-15');
INSERT INTO playlist_tracks VALUES (2, 10, 3, '2024-01-15');
INSERT INTO playlist_tracks VALUES (2, 12, 4, '2024-01-16');
INSERT INTO playlist_tracks VALUES (3, 3, 1, '2024-02-01');
INSERT INTO playlist_tracks VALUES (3, 4, 2, '2024-02-01');
INSERT INTO playlist_tracks VALUES (3, 6, 3, '2024-02-02');
INSERT INTO playlist_tracks VALUES (3, 14, 4, '2024-02-02');
`;

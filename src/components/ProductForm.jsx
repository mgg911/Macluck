import { useState } from "react";

export default function ProductForm() {
  const categories = [
    {
      name: "iPhone",
      subcategories: [
        "iPhone 16",
        "iPhone 16 Plus",
        "iPhone 16 Pro",
        "iPhone 16 Pro Max",
        "iPhone 15",
        "iPhone 15 Pro",
      ],
    },
    {
      name: "Samsung",
      subcategories: [
        "Galaxy S25",
        "Galaxy S25+",
        "Galaxy S25 Ultra",
        "Galaxy A56",
      ],
    },
    {
      name: "Xiaomi",
      subcategories: [
        "Xiaomi 15",
        "Redmi Note",
        "POCO",
      ],
    },
  ];

  const colors = [
    "Черный",
    "Белый",
    "Серый",
    "Синий",
    "Голубой",
    "Красный",
    "Розовый",
    "Зеленый",
    "Фиолетовый",
    "Золотой",
    "Silver",
    "Titanium Natural",
  ];

  const [product, setProduct] = useState({
    name: "",
    brand: "",
    model: "",
    category: "",
    subcategory: "",
    memory: "",
    price: "",
    oldPrice: "",
    quantity: "",
    description: "",
    specs: "",
    isNew: false,
    isHit: false,
    isSale: false,
    colors: [],
    images: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleColor = (color) => {
    if (product.colors.includes(color)) {
      setProduct({
        ...product,
        colors: product.colors.filter((c) => c !== color),
      });
    } else {
      setProduct({
        ...product,
        colors: [...product.colors, color],
      });
    }
  };

  const handleImages = (e) => {
    setProduct({
      ...product,
      images: [...e.target.files],
    });
  };

  const saveProduct = () => {
    console.log(product);
    alert("Товар сохранен");
  };

  const clearForm = () => {
    setProduct({
      name: "",
      brand: "",
      model: "",
      category: "",
      subcategory: "",
      memory: "",
      price: "",
      oldPrice: "",
      quantity: "",
      description: "",
      specs: "",
      isNew: false,
      isHit: false,
      isSale: false,
      colors: [],
      images: [],
    });
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 30,
        background: "#fff",
        borderRadius: 15,
      }}
    >
      <h2>Добавление товара</h2>
      <div style={{ display: "grid", gap: 20, marginTop: 30 }}>

  <input
    name="name"
    placeholder="Название товара"
    value={product.name}
    onChange={handleChange}
  />

  <input
    name="brand"
    placeholder="Бренд"
    value={product.brand}
    onChange={handleChange}
  />

  <input
    name="model"
    placeholder="Модель"
    value={product.model}
    onChange={handleChange}
  />

  <select
    name="category"
    value={product.category}
    onChange={handleChange}
  >
    <option value="">Выберите категорию</option>

    {categories.map((cat) => (
      <option key={cat.name} value={cat.name}>
        {cat.name}
      </option>
    ))}
  </select>

  <select
    name="subcategory"
    value={product.subcategory}
    onChange={handleChange}
  >
    <option value="">Выберите подкатегорию</option>

    {categories
      .find((c) => c.name === product.category)
      ?.subcategories.map((sub) => (
        <option key={sub} value={sub}>
          {sub}
        </option>
      ))}
  </select>

  <input
    name="memory"
    placeholder="Память (например 128GB)"
    value={product.memory}
    onChange={handleChange}
  />

  <input
    name="price"
    placeholder="Цена"
    value={product.price}
    onChange={handleChange}
  />

  <input
    name="oldPrice"
    placeholder="Старая цена"
    value={product.oldPrice}
    onChange={handleChange}
  />

  <input
    name="quantity"
    placeholder="Количество на складе"
    value={product.quantity}
    onChange={handleChange}
  />

  <textarea
    name="description"
    placeholder="Описание товара"
    rows="5"
    value={product.description}
    onChange={handleChange}
  />

  <textarea
    name="specs"
    placeholder="Характеристики"
    rows="5"
    value={product.specs}
    onChange={handleChange}
  />

  <div>
    <h3>Цвета</h3>

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => toggleColor(color)}
          style={{
            padding: "8px 15px",
            borderRadius: 8,
            border: "1px solid #ccc",
            cursor: "pointer",
            background: product.colors.includes(color)
              ? "#4CAF50"
              : "#fff",
            color: product.colors.includes(color)
              ? "#fff"
              : "#000",
          }}
        >
          {color}
        </button>
      ))}
    </div>
  </div>

  <div>
    <h3>Фотографии товара</h3>

    <input
      type="file"
      multiple
      onChange={handleImages}
    />
  </div>

  <label>
    <input
      type="checkbox"
      name="isNew"
      checked={product.isNew}
      onChange={handleChange}
    />
    Новинка
  </label>

  <label>
    <input
      type="checkbox"
      name="isHit"
      checked={product.isHit}
      onChange={handleChange}
    />
    Хит продаж
  </label>

  <label>
    <input
      type="checkbox"
      name="isSale"
      checked={product.isSale}
      onChange={handleChange}
    />
    Товар со скидкой
  </label><div
    style={{
      display: "flex",
      gap: "15px",
      marginTop: "20px",
    }}
  >
    <button
      type="button"
      onClick={saveProduct}
      style={{
        background: "#4CAF50",
        color: "#fff",
        border: "none",
        padding: "12px 24px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      💾 Сохранить товар
    </button>

    <button
      type="button"
      onClick={clearForm}
      style={{
        background: "#f44336",
        color: "#fff",
        border: "none",
        padding: "12px 24px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      🗑 Очистить
    </button>
  </div>

</div>

    </div>
  );
}

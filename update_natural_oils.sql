-- إضافة "60 ملل" لمنتجات قسم الزيوت الطبيعية
-- ماعدا زيت جوز الهند وتركيبة زيت زيتون وقرنفل

UPDATE products
SET name_ar = name_ar || ' 60 ملل'
WHERE id IN (
  SELECT p.id
  FROM products p
  JOIN product_categories pc ON p.id = pc.product_id
  JOIN categories c ON pc.category_id = c.id
  WHERE c.slug = 'الزيوت-الطبيعيه'
    AND p.name_ar NOT LIKE '%زيت جوز الهند%'
    AND p.name_ar NOT LIKE '%تركيبة زيت زيتون%'
    AND p.name_ar NOT LIKE '%60 ملل%'
);

-- للتأكد — شوف النتيجة بعد التحديث
SELECT p.name_ar, p.name_en
FROM products p
JOIN product_categories pc ON p.id = pc.product_id
JOIN categories c ON pc.category_id = c.id
WHERE c.slug = 'الزيوت-الطبيعيه'
ORDER BY p.name_ar;

const form = document.querySelector("#lead-form");
const statusLine = document.querySelector(".form-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  statusLine.textContent = "Отправляем заявку...";

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    message: String(formData.get("message") || "").trim(),
  };

  try {
    const response = await fetch("/.netlify/functions/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Не удалось отправить заявку");
    }

    form.reset();
    statusLine.textContent = "Заявка отправлена. Скоро свяжемся с вами.";
  } catch (error) {
    statusLine.textContent = "Пока не получилось отправить. Позвоните или напишите на hello@arnex.ru.";
  }
});

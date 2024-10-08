const asyncInterval = async (callback, ms, triesLeft = 3) => {
	return new Promise((resolve, reject) => {
		const interval = setInterval(async () => {
			if (await callback()) {
				resolve();
				clearInterval(interval);
			} else if (triesLeft <= 1) {
				reject();
				clearInterval(interval);
			}
			triesLeft--;
		}, ms);
	});
};

let articlePrices = [];

const downloadCSV = (filename, data) => {
	const csvContent =
		"data:text/csv;charset=utf-8," +
		"Site;Traffic per Day;X;Trust;TF/CF;Article\n" +
		data.map(row => row.join(";")).join("\n");
	const encodedUri = encodeURI(csvContent);
	const link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
};

const getCurrentDate = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const wrapper = async () => {
	try {
		await asyncInterval(
			async function () {
				console.log("Выполняется...");

				const tableRows = $(".site-link__info");
				if (tableRows.length === 0) {
					console.log("Селектор tableRows пуст");
					return;
				}

				for (let row of tableRows) {
					const siteName = $(row).find("a").text();
					const trafficSelector = $(row)
						.closest("tr")
						.find('td[data-th="Трафик в сутки"] > div.table__td');
					const traffic = trafficSelector.text().trim().replace(/\s+/g, ""); // Удаляем все пробелы

					const xSelector = $(row)
						.closest("tr")
						.find('td[data-th="ИКС"] > div.table__td');
					const x = xSelector.text().trim(); // Получаем значение ИКС

					const trustSelector = $(row)
						.closest("tr")
						.find('td[data-th="Траст"] > div.table__td');
					const trust = trustSelector.text().trim(); // Получаем значение траста

					const tfCfSelector = $(row)
						.closest("tr")
						.find(
							'td[data-th="Ссылочная мощь (TF/CF)"] > div.table__td span.tooltipster'
						);
					const tfCf = tfCfSelector.text().trim(); // Получаем значение TF/CF

					const articleSelector = $(row)
						.closest("tr")
						.find(
							'td[data-th="Статья"] > div.table__td span.whitespace-nowrap'
						);
					const articlePriceText = articleSelector.text().trim(); // Получаем значение цены статьи без дополнительных данных
					const articlePrice = parseFloat(
						articlePriceText.replace(/[^\d]/g, "")
					); // Удаляем все символы, кроме цифр, и преобразуем в число

					articlePrices.push([siteName, traffic, x, trust, tfCf, articlePrice]);
				}

				const pagen = $(".pagination > span").next();

				if (pagen.length === 0) {
					console.error("Селектор pagen пуст");
					return true; // Возвращаем true, чтобы завершить интервал, когда заканчивается пагинация
				}
				pagen.click();

				return false; // Продолжаем интервал
			},
			2500,
			244
		); // Кол. повторений (количество страниц с площадками)
	} catch (e) {
		console.log("Парсинг завершен");
		console.log(articlePrices.join("\n"));
	}
	const currentDate = getCurrentDate();
	const articlePriceFilename = `ggl_${currentDate}.csv`;
	downloadCSV(articlePriceFilename, articlePrices);
	console.log("Готово");
};

wrapper();

const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.tus.si/#s2");
  const containerElement = await page.$(
    "ul.custom-slick-slider:nth-child(3) > div:nth-child(1) > div:nth-child(1)"
  );
  let secondDates = [];
  let linksAndNames = [];
  if (containerElement) {
    const elements = await containerElement.$$(".list-item");

    if (elements.length > 0) {
      for (const [index, element] of elements.entries()) {
        const html = await page.evaluate(
          (element) => element.outerHTML,
          element
        );

        const pdfLink = await element.$eval(".pdf", (link) => link.href);

        const timeElements = await element.$$("time");

        const aElements = await element.$$("a");

        const html2 = await element.evaluate((el) => {
          const aElements = el.querySelectorAll("a");
          if (aElements.length >= 2) {
            return aElements[2].outerHTML;
          } else {
            return "";
          }
        });

        const link = await element.$eval("a", (a) => a.getAttribute("href"));
        const name = await element.$eval("a", (a) => a.innerText);

        if (timeElements.length >= 2) {
          const secondDate = await page.evaluate(
            (time) => time.innerText,
            timeElements[1]
          );
          secondDates.push(secondDate.trim());
        } else {
          secondDates.push("");
        }

        const match = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/i.exec(
          html2
        );
        if (match) {
          const link = match[1];
          const name = match[2];
          const date = secondDates[index];
          const pdf = pdfLink;
          linksAndNames.push({ link, name, date, pdf });
        } else {
          linksAndNames.push({ link: "", name: "", date: "", pdf: "" });
        }
      }
    } else {
      console.error("Дочерние элементы не найдены.");
    }
  } else {
    console.error("Контейнерный элемент не найден.");
  }

  fs.writeFileSync("linksAndNames.json", JSON.stringify(linksAndNames));

  console.log(JSON.stringify(linksAndNames));

  await browser.close();
})();

export default function (view) {
  view.addEventListener("viewshow", () => import(
    ApiClient.getUrl("web/ConfigurationPage", {
      name: "Xtream.js",
    })
  ).then((Xtream) => Xtream.default
  ).then((Xtream) => {
    const pluginId = Xtream.pluginConfig.UniqueId;
    Xtream.setTabs(3);

    const getConfig = ApiClient.getPluginConfiguration(pluginId);
    const visible = view.querySelector("#Visible");
    getConfig.then((config) => visible.checked = config.IsVodVisible);
    const tmdbOverride = view.querySelector("#TmdbOverride");
    getConfig.then((config) => TmdbOverride.checked = config.IsTmdbVodOverride);
    const table = view.querySelector('#VodContent');
    const mainFolderName = view.querySelector('#MainFolderName');

    getConfig.then((config) => {
      mainFolderName.value = config.MainFolderName || "Filme";
    });

    const updateVodCount = (vodData) => {
      let count = 0;
      if (vodData) {
        Object.values(vodData).forEach(arr => {
          if (Array.isArray(arr)) count += arr.length;
        });
      }
      const counter = view.querySelector('#VodSelectedCount');
      if (counter) counter.textContent = `Ausgewählte Filme: ${count}`;
    };

    Xtream.populateCategoriesTable(
      table,
      () => getConfig.then((config) => config.Vod),
      () => Xtream.fetchJson('Xtream/VodCategories'),
      (categoryId) => Xtream.fetchJson(`Xtream/VodCategories/${categoryId}`),
    ).then((data) => {
      updateVodCount(data);
      // Beobachte Änderungen an der Auswahl
      const observer = new MutationObserver(() => updateVodCount(data));
      observer.observe(table, { childList: true, subtree: true });

      view.querySelector('#XtreamVodForm').addEventListener('submit', (e) => {
        Dashboard.showLoadingMsg();

        ApiClient.getPluginConfiguration(pluginId).then((config) => {
          config.IsVodVisible = visible.checked;
          config.IsTmdbVodOverride = tmdbOverride.checked;
          config.Vod = data;
          config.CreateMainFolder = true; // Hauptordner wird immer erstellt
          config.MainFolderName = mainFolderName.value || "Filme";
          ApiClient.updatePluginConfiguration(pluginId, config).then((result) => {
            Dashboard.processPluginConfigurationUpdateResult(result);
          });
        });

        e.preventDefault();
        return false;
      });
    });
  }));
}
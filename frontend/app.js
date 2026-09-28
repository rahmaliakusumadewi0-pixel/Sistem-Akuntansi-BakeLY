const state = {
  config: {
    url: 'https://kjoyivzexlbqytccoczs.supabase.co',
    key: 'sb_publishable_W3Rybv-DV6yXj1N5bMxFmA_cklC0xuC'
  },

  sales: [],
  materials: [],
  products: [],
  productions: [],
  usages: []
};


// ================= HELPER =================

const $ = (selector) => document.querySelector(selector);

const rupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const quantity = (value) =>
  new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2
  }).format(Number(value || 0));

const dateId = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short'
  });
};


// ================= SUPABASE =================

function supabaseHeaders(extra = {}) {
  return {
    apikey: state.config.key,
    Authorization: `Bearer ${state.config.key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra
  };
}


async function api(path, options = {}) {
  const response = await fetch(
    `${state.config.url}/rest/v1/${path}`,
    {
      ...options,
      headers: supabaseHeaders(options.headers || {})
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.message ||
      body.error_description ||
      body.error ||
      body.hint ||
      `Supabase error ${response.status}`
    );
  }

  return body;
}


async function rpc(name, payload) {
  return api(`rpc/${name}`, {
    method: 'POST',

    headers: {
      apikey: state.config.key,
      Authorization: `Bearer ${state.config.key}`,
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(payload)
  });
}


// ================= LOAD DATA =================

async function loadData() {
  $('#connection-label').textContent = 'Menghubungkan...';

  try {

    const results = await Promise.allSettled([

      api(
        'penjualan?select=*&order=tanggal.desc&limit=30'
      ),

      api(
        'bahan_baku?select=*&order=nama.asc'
      ),

      api(
        'produk?select=*&order=nama.asc'
      ),

      api(
        'produksi?select=*,produk(nama)&order=tanggal.desc&limit=30'
      ),

      api(
        'pemakaian_bb?select=*,bahan_baku(nama,satuan),produksi(nomor_produksi,tanggal)&order=created_at.desc&limit=50'
      )

    ]);


    state.sales =
      results[0].status === 'fulfilled'
        ? results[0].value
        : [];

    state.materials =
      results[1].status === 'fulfilled'
        ? results[1].value
        : [];

    state.products =
      results[2].status === 'fulfilled'
        ? results[2].value
        : [];

    state.productions =
      results[3].status === 'fulfilled'
        ? results[3].value
        : [];

    state.usages =
      results[4].status === 'fulfilled'
        ? results[4].value
        : [];


    const hasError =
      results.some(
        (result) => result.status === 'rejected'
      );


    $('#connection-label').textContent =
      hasError
        ? 'Supabase terhubung'
        : 'Supabase terhubung';

    $('.status-dot').style.background = '#91bd7f';


    render();


    if (hasError) {
      showToast(
        'Supabase terhubung. Ada data tertentu yang belum dapat dimuat.'
      );
    }

  } catch (error) {

    $('#connection-label').textContent =
      'Koneksi gagal';

    $('.status-dot').style.background = '#c66';

    showToast(error.message);

    render();
  }
}


// ================= EMPTY TABLE =================

function emptyRow(
  columns,
  text = 'Belum ada data.'
) {
  return `
    <tr>
      <td colspan="${columns}" class="empty-state">
        ${text}
      </td>
    </tr>
  `;
}


// ================= RENDER =================

function render() {

  const salesTotal =
    state.sales.reduce(
      (sum, sale) =>
        sum + Number(sale.total || 0),
      0
    );


  const finishedTotal =
    state.products.reduce(
      (sum, product) =>
        sum + Number(product.stok || 0),
      0
    );


  const inventoryValue =
    state.materials.reduce(
      (sum, item) =>
        sum +
        Number(item.stok || 0) *
        Number(item.harga_satuan || 0),
      0
    );


  const lowStock =
    state.materials.filter(
      (item) =>
        Number(item.stok) <=
        Number(item.stok_minimum)
    );


  // DASHBOARD METRICS

  $('#sales-total').textContent =
    rupiah(salesTotal);

  $('#sales-count').textContent =
    `${state.sales.length} transaksi`;


  $('#finished-total').textContent =
    `${quantity(finishedTotal)} pcs`;

  $('#product-count').textContent =
    `${state.products.filter(
      (item) => item.aktif !== false
    ).length} produk aktif`;


  $('#inventory-total').textContent =
    rupiah(inventoryValue);

  $('#low-stock-count').textContent =
    `${lowStock.length} bahan`;


  // LOW STOCK

  $('#low-stock-list').innerHTML =
    lowStock.length
      ? lowStock
          .map(
            (item) => `
              <div class="stock-item">

                <div>
                  <div class="stock-name">
                    ${item.nama}
                  </div>

                  <div class="stock-meta">
                    ${quantity(item.stok)}
                    ${item.satuan}
                    tersisa
                  </div>
                </div>

                <div class="stock-warning">
                  MIN ${quantity(item.stok_minimum)}
                </div>

              </div>
            `
          )
          .join('')

      : `
        <p class="empty-state">
          Semua stok aman.
        </p>
      `;


  // RECENT SALES

  $('#recent-sales').innerHTML =
    state.sales.length

      ? state.sales
          .slice(0, 5)
          .map(
            (sale) => `
              <tr>

                <td>
                  <button
                    class="table-link"
                    data-sale-detail="${sale.id}"
                  >
                    ${sale.nomor_nota}
                  </button>
                </td>

                <td>
                  ${sale.pelanggan || 'Umum'}
                </td>

                <td class="align-right">
                  ${rupiah(sale.total)}
                </td>

              </tr>
            `
          )
          .join('')

      : emptyRow(3);


  // SALES TABLE

  $('#sales-table').innerHTML =
    state.sales.length

      ? state.sales
          .map(
            (sale) => `
              <tr>

                <td>
                  <button
                    class="table-link"
                    data-sale-detail="${sale.id}"
                  >
                    ${sale.nomor_nota}
                  </button>
                </td>

                <td>
                  ${sale.pelanggan || 'Umum'}
                </td>

                <td>
                  ${dateId(sale.tanggal)}
                </td>

                <td>
                  <span class="tag">
                    ${sale.status || 'Selesai'}
                  </span>
                </td>

                <td class="align-right">
                  ${rupiah(sale.total)}
                </td>

              </tr>
            `
          )
          .join('')

      : emptyRow(5);


  // PRODUCTION

  $('#recent-production').innerHTML =
    state.productions.length
      ? state.productions
          .slice(0, 5)
          .map(
            (item) =>
              productionRow(item, false)
          )
          .join('')
      : emptyRow(4);


  $('#production-table').innerHTML =
    state.productions.length
      ? state.productions
          .map(
            (item) =>
              productionRow(item, true)
          )
          .join('')
      : emptyRow(5);


  // USAGE

  $('#usage-table').innerHTML =
    state.usages.length

      ? state.usages
          .map(
            (item) => `
              <tr>

                <td>
                  ${
                    item.produksi?.nomor_produksi ||
                    'Produksi lama'
                  }
                </td>

                <td>
                  ${item.bahan_baku?.nama || '-'}
                </td>

                <td>
                  ${quantity(item.jumlah)}
                  ${item.bahan_baku?.satuan || ''}
                </td>

                <td>
                  ${dateId(
                    item.produksi?.tanggal ||
                    item.created_at
                  )}
                </td>

              </tr>
            `
          )
          .join('')

      : emptyRow(4);


  // MATERIALS

  $('#material-table').innerHTML =
    state.materials.length

      ? state.materials
          .map((item) => {

            const stock =
              Number(item.stok || 0);

            const minimum =
              Number(item.stok_minimum || 0);

            let status;

            if (stock < minimum) {
              status =
                '<span class="stock-warning">di bawah minimum</span>';
            } else if (stock === minimum) {
              status =
                '<span class="stock-minimum">stok minimum</span>';
            } else {
              status =
                '<span class="stock-ok">aman</span>';
            }


            return `
              <tr>

                <td>${item.nama}</td>

                <td>${item.satuan}</td>

                <td>${quantity(stock)}</td>

                <td>${quantity(minimum)}</td>

                <td>${rupiah(item.harga_satuan)}</td>

                <td>${status}</td>

                <td class="row-actions">

                  <button
                    data-edit-material="${item.id}"
                  >
                    Edit
                  </button>

                  <button
                    data-delete-material="${item.id}"
                  >
                    Hapus
                  </button>

                </td>

              </tr>
            `;

          })
          .join('')

      : emptyRow(7);


  // PRODUCTS

  $('#product-table').innerHTML =
    state.products.length

      ? state.products
          .map(
            (item) => {

              const hasStock =
                Number(item.stok || 0) > 0;


              return `
                <tr>

                  <td>
                    ${item.kode_produk || '-'}
                  </td>

                  <td>
                    ${item.nama}
                  </td>

                  <td>
                    ${rupiah(item.harga_jual)}
                  </td>

                  <td>
                    ${quantity(item.stok)}
                    ${item.satuan || 'pcs'}
                  </td>

                  <td>

                    <span
                      class="tag ${
                        hasStock
                          ? ''
                          : 'tag-muted'
                      }"
                    >
                      ${
                        hasStock
                          ? 'tersedia'
                          : 'habis'
                      }
                    </span>

                  </td>

                  <td class="row-actions">

                    <button
                      data-edit-product="${item.id}"
                    >
                      Edit
                    </button>

                    <button
                      data-delete-product="${item.id}"
                    >
                      Hapus
                    </button>

                  </td>

                </tr>
              `;

            }
          )
          .join('')

      : emptyRow(6);


  // CHART

  $('#sales-chart').innerHTML =
    renderChart();


  // REPORT

  renderReports();


  // SELECT

  refreshSelects();
}


// ================= PRODUCTION ROW =================

function productionRow(item, full) {

  const productionNumber =
    item.nomor_produksi ||
    item.nomor ||
    item.kode_produksi ||
    '-';


  if (full) {

    return `
      <tr>

        <td>
          ${productionNumber}
        </td>

        <td>
          ${item.produk?.nama || '-'}
        </td>

        <td>
          ${quantity(item.jumlah)} pcs
        </td>

        <td>
          ${dateId(item.tanggal)}
        </td>

        <td>
          ${item.catatan || '-'}
        </td>

      </tr>
    `;

  }


  return `
    <tr>

      <td>
        ${productionNumber}
      </td>

      <td>
        ${item.produk?.nama || '-'}
      </td>

      <td>
        ${quantity(item.jumlah)} pcs
      </td>

      <td>
        ${dateId(item.tanggal)}
      </td>

    </tr>
  `;
}


// ================= REPORT =================

function renderReports() {

  const recentSales =
    [...state.sales].sort(
      (a, b) =>
        new Date(b.tanggal) -
        new Date(a.tanggal)
    );


  const reportSalesTotal =
    recentSales.reduce(
      (sum, sale) =>
        sum + Number(sale.total || 0),
      0
    );


  const productionTotal =
    state.productions.reduce(
      (sum, item) =>
        sum + Number(item.jumlah || 0),
      0
    );


  const lowStock =
    state.materials.filter(
      (item) =>
        Number(item.stok) <=
        Number(item.stok_minimum)
    );


  const readyProducts =
    state.products
      .filter(
        (item) =>
          Number(item.stok) > 0
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.stok || 0),
        0
      );


  $('#report-sales-total').textContent =
    rupiah(reportSalesTotal);

  $('#report-sales-count-detail').textContent =
    `${recentSales.length} transaksi`;


  $('#report-production-total').textContent =
    `${quantity(productionTotal)} pcs`;

  $('#report-production-count').textContent =
    `${state.productions.length} batch`;


  $('#report-low-stock-total').textContent =
    `${lowStock.length} bahan`;


  $('#report-ready-product-total').textContent =
    `${quantity(readyProducts)} pcs`;


  $('#report-ready-product-label').textContent =
    `${
      state.products.filter(
        (item) =>
          Number(item.stok) > 0
      ).length
    } produk siap jual`;


  $('#report-sales-table').innerHTML =
    recentSales.length

      ? recentSales
          .slice(0, 6)
          .map(
            (sale) => `
              <tr>

                <td>
                  <button
                    class="table-link"
                    data-sale-detail="${sale.id}"
                  >
                    ${sale.nomor_nota}
                  </button>
                </td>

                <td>
                  ${sale.pelanggan || 'Umum'}
                </td>

                <td>
                  ${dateId(sale.tanggal)}
                </td>

                <td class="align-right">
                  ${rupiah(sale.total)}
                </td>

              </tr>
            `
          )
          .join('')

      : emptyRow(4);


  $('#report-stock-table').innerHTML =
    lowStock.length

      ? lowStock
          .slice(0, 6)
          .map(
            (item) => `
              <tr>

                <td>
                  ${item.nama}
                </td>

                <td>
                  ${quantity(item.stok)}
                  ${item.satuan}
                </td>

                <td>
                  ${quantity(item.stok_minimum)}
                </td>

                <td>
                  <span class="stock-warning">
                    Urgent
                  </span>
                </td>

              </tr>
            `
          )
          .join('')

      : emptyRow(
          4,
          'Semua stok aman.'
        );
}


// ================= CHART =================

function renderChart() {

  const items =
    [...state.sales]
      .sort(
        (a, b) =>
          new Date(a.tanggal) -
          new Date(b.tanggal)
      )
      .slice(-7);


  if (!items.length) {

    return `
      <p class="empty-state">
        Belum ada transaksi untuk grafik.
      </p>
    `;
  }


  const max =
    Math.max(
      ...items.map(
        (item) =>
          Number(item.total || 0)
      ),
      1
    );


  return items
    .map(
      (item) => {

        const height =
          Math.max(
            8,
            Number(item.total || 0) /
              max *
              100
          );


        return `
          <div class="bar-wrap">

            <div
              class="bar"
              style="height:${height}%"
              title="${rupiah(item.total)}"
            ></div>

            <small>
              ${dateId(item.tanggal)}
              <br>
              ${rupiah(item.total)}
            </small>

          </div>
        `;
      }
    )
    .join('');
}


// ================= SELECT =================

function refreshSelects() {

  const productionSelect =
    $('#production-product');


  if (productionSelect) {

    const current =
      productionSelect.value;


    productionSelect.innerHTML =
      state.products
        .map(
          (item) => `
            <option value="${item.id}">
              ${item.nama}
              (${quantity(item.stok)}
              ${item.satuan || 'pcs'})
            </option>
          `
        )
        .join('');


    if (
      state.products.some(
        (item) =>
          String(item.id) ===
          String(current)
      )
    ) {
      productionSelect.value =
        current;
    }
  }


  document
    .querySelectorAll('.usage-material')
    .forEach((select) => {

      const current =
        select.value;


      select.innerHTML =
        state.materials
          .map(
            (item) => `
              <option value="${item.id}">
                ${item.nama}
              </option>
            `
          )
          .join('');


      if (
        state.materials.some(
          (item) =>
            String(item.id) ===
            String(current)
        )
      ) {
        select.value =
          current;
      }
    });


  document
    .querySelectorAll('.sale-product')
    .forEach((select) => {

      const current =
        select.value;


      select.innerHTML =
        state.products
          .map(
            (item) => `
              <option value="${item.id}">
                ${item.nama}
                (${rupiah(item.harga_jual)})
              </option>
            `
          )
          .join('');


      if (
        state.products.some(
          (item) =>
            String(item.id) ===
            String(current)
        )
      ) {
        select.value =
          current;
      }
    });
}


// ================= DYNAMIC ROW =================

function addUsageRow() {

  $('#usage-fields').insertAdjacentHTML(
    'beforeend',

    `
      <div class="dynamic-row">

        <select class="usage-material">
        </select>

        <input
          class="usage-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Jumlah"
          required
        >

        <button
          type="button"
          class="remove-row"
        >
          ×
        </button>

      </div>
    `
  );


  refreshSelects();
}


function addSaleRow() {

  $('#sale-fields').insertAdjacentHTML(
    'beforeend',

    `
      <div class="dynamic-row">

        <select class="sale-product">
        </select>

        <input
          class="sale-amount"
          type="number"
          min="1"
          step="1"
          placeholder="Jumlah"
          required
        >

        <button
          type="button"
          class="remove-row"
        >
          ×
        </button>

      </div>
    `
  );


  refreshSelects();
}


// ================= MODAL =================

function openModal(id) {

  const modal = $(id);

  if (!modal) return;

  modal.classList.add('visible');


  if (
    id === '#production-modal' &&
    !$('#usage-fields').children.length
  ) {
    addUsageRow();
  }


  if (
    id === '#sale-modal' &&
    !$('#sale-fields').children.length
  ) {
    addSaleRow();
  }
}


function closeModal(modal) {

  if (!modal) return;

  modal.classList.remove('visible');

  const message =
    modal.querySelector('.form-message');

  if (message) {
    message.textContent = '';
  }
}


// ================= TOAST =================

function showToast(message) {

  const toast = $('#toast');

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add('visible');


  setTimeout(
    () =>
      toast.classList.remove(
        'visible'
      ),
    3500
  );
}


// ================= NAVIGATION =================

function goToView(view) {

  const target =
    $(`#${view}-view`);

  if (!target) return;


  document
    .querySelectorAll('.view')
    .forEach(
      (section) =>
        section.classList.remove(
          'active-view'
        )
    );


  target.classList.add(
    'active-view'
  );


  document
    .querySelectorAll('.nav-item')
    .forEach(
      (item) =>
        item.classList.toggle(
          'active',
          item.dataset.view === view
        )
    );


  const titles = {

    dashboard: [
      'Ringkasan usaha',
      'Sistem Akuntansi Bakely'
    ],

    bahan: [
      'Master data',
      'Bahan baku'
    ],

    produk: [
      'Master data',
      'Barang jadi'
    ],

    pemakaian: [
      'Transaksi',
      'Pemakaian bahan baku'
    ],

    produksi: [
      'Transaksi',
      'Produksi'
    ],

    penjualan: [
      'Transaksi',
      'Penjualan'
    ],

    laporan: [
      'Analisis usaha',
      'Laporan bakery'
    ]

  };


  if (titles[view]) {

    $('#page-kicker').textContent =
      titles[view][0];

    $('#page-title').textContent =
      titles[view][1];

  }
}


// ================= NAV EVENT =================

document
  .querySelectorAll(
    '.nav-item, [data-view-link]'
  )
  .forEach(
    (button) => {

      button.addEventListener(
        'click',
        () =>
          goToView(
            button.dataset.view ||
            button.dataset.viewLink
          )
      );

    }
  );


// ================= OPEN MODAL =================

document
  .querySelectorAll('[data-open]')
  .forEach(
    (button) => {

      button.addEventListener(
        'click',
        () =>
          openModal(
            `#${button.dataset.open}`
          )
      );

    }
  );


// ================= CLOSE MODAL =================

document
  .querySelectorAll('.modal-backdrop')
  .forEach(
    (modal) => {

      modal.addEventListener(
        'click',
        (event) => {

          if (
            event.target === modal ||
            event.target.matches(
              '[data-close-modal]'
            )
          ) {
            closeModal(modal);
          }

        }
      );

    }
  );


// ================= DELETE / EDIT =================

document.addEventListener(
  'click',
  async (event) => {

    const materialId =
      event.target.dataset.deleteMaterial;

    const productId =
      event.target.dataset.deleteProduct;


    // REMOVE DYNAMIC ROW

    if (
      event.target.classList.contains(
        'remove-row'
      )
    ) {

      const row =
        event.target.closest(
          '.dynamic-row'
        );

      if (row) row.remove();

      return;
    }


    // DELETE MATERIAL

    if (
      materialId &&
      confirm(
        'Hapus bahan baku ini?'
      )
    ) {

      try {

        await api(
          `bahan_baku?id=eq.${materialId}`,
          {
            method: 'DELETE'
          }
        );

        await loadData();

        showToast(
          'Bahan baku berhasil dihapus.'
        );

      } catch (error) {

        showToast(
          error.message
        );

      }

      return;
    }


    // DELETE PRODUCT

    if (
      productId &&
      confirm(
        'Hapus produk ini?'
      )
    ) {

      try {

        await api(
          `produk?id=eq.${productId}`,
          {
            method: 'DELETE'
          }
        );

        await loadData();

        showToast(
          'Produk berhasil dihapus.'
        );

      } catch (error) {

        showToast(
          error.message
        );

      }

      return;
    }


    // EDIT MATERIAL

    const editMaterial =
      event.target.dataset.editMaterial;


    if (editMaterial) {

      const item =
        state.materials.find(
          (material) =>
            String(material.id) ===
            String(editMaterial)
        );


      if (!item) return;


      $('#material-id').value =
        item.id;

      $('#material-name').value =
        item.nama;

      $('#material-unit').value =
        item.satuan;

      $('#material-stock').value =
        item.stok;

      $('#material-minimum').value =
        item.stok_minimum;

      $('#material-price').value =
        item.harga_satuan;


      $('#material-modal-title').textContent =
        'Edit bahan baku';


      openModal(
        '#material-modal'
      );

      return;
    }


    // EDIT PRODUCT

    const editProduct =
      event.target.dataset.editProduct;


    if (editProduct) {

      const item =
        state.products.find(
          (product) =>
            String(product.id) ===
            String(editProduct)
        );


      if (!item) return;


      $('#product-id').value =
        item.id;

      $('#product-code').value =
        item.kode_produk || '';

      $('#product-name').value =
        item.nama;

      $('#product-price').value =
        item.harga_jual;

      $('#product-stock').value =
        item.stok;

      $('#product-unit').value =
        item.satuan;


      $('#product-modal-title').textContent =
        'Edit barang jadi';


      openModal(
        '#product-modal'
      );
    }

  }
);


// ================= SALE DETAIL =================

document.addEventListener(
  'click',
  async (event) => {

    const id =
      event.target.dataset.saleDetail;


    if (!id) return;


    const sale =
      state.sales.find(
        (item) =>
          String(item.id) ===
          String(id)
      );


    if (!sale) return;


    try {

      const details =
        await api(
          `detail_penjualan?select=*,produk(nama)&penjualan_id=eq.${id}`
        );


      $('#detail-sale-number').textContent =
        sale.nomor_nota;


      $('#detail-sale-meta').textContent =
        `${sale.pelanggan || 'Umum'} · ${dateId(
          sale.tanggal
        )} · ${sale.status || 'Selesai'}`;


      $('#detail-sale-total').textContent =
        rupiah(sale.total);


      $('#sale-detail-table').innerHTML =
        details.length

          ? details
              .map(
                (item) => `
                  <tr>

                    <td>
                      ${item.produk?.nama || '-'}
                    </td>

                    <td>
                      ${quantity(item.jumlah)}
                    </td>

                    <td>
                      ${rupiah(item.harga_satuan)}
                    </td>

                    <td class="align-right">
                      ${rupiah(item.subtotal)}
                    </td>

                  </tr>
                `
              )
              .join('')

          : emptyRow(
              4,
              'Detail belum tersedia.'
            );


      openModal(
        '#sale-detail-modal'
      );

    } catch (error) {

      showToast(
        error.message
      );

    }

  }
);


// ================= ADD ROW BUTTON =================

$('#add-usage')
  ?.addEventListener(
    'click',
    addUsageRow
  );


$('#add-sale-item')
  ?.addEventListener(
    'click',
    addSaleRow
  );


// ================= MATERIAL FORM =================

$('#material-modal form')
  .addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const id =
        $('#material-id').value;


      const payload = {

        nama:
          $('#material-name').value.trim(),

        satuan:
          $('#material-unit').value.trim(),

        stok:
          Number(
            $('#material-stock').value
          ),

        stok_minimum:
          Number(
            $('#material-minimum').value
          ),

        harga_satuan:
          Number(
            $('#material-price').value
          )

      };


      try {

        await api(
          id
            ? `bahan_baku?id=eq.${id}`
            : 'bahan_baku',
          {

            method:
              id ? 'PATCH' : 'POST',

            body:
              JSON.stringify(payload)

          }
        );


        closeModal(
          $('#material-modal')
        );


        event.currentTarget.reset();

        $('#material-id').value =
          '';

        $('#material-modal-title').textContent =
          'Tambah bahan baku';


        await loadData();


        showToast(
          'Bahan baku disimpan.'
        );

      } catch (error) {

        event.currentTarget
          .querySelector(
            '.form-message'
          )
          .textContent =
          error.message;

      }

    }
  );


// ================= PRODUCT FORM =================

$('#product-modal form')
  .addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const id =
        $('#product-id').value;


      const payload = {

        kode_produk:
          $('#product-code').value.trim(),

        nama:
          $('#product-name').value.trim(),

        harga_jual:
          Number(
            $('#product-price').value
          ),

        stok:
          Number(
            $('#product-stock').value
          ),

        satuan:
          $('#product-unit').value.trim(),

        aktif:
          true

      };


      try {

        await api(
          id
            ? `produk?id=eq.${id}`
            : 'produk',
          {

            method:
              id ? 'PATCH' : 'POST',

            body:
              JSON.stringify(payload)

          }
        );


        closeModal(
          $('#product-modal')
        );


        event.currentTarget.reset();

        $('#product-id').value =
          '';

        $('#product-modal-title').textContent =
          'Tambah barang jadi';


        await loadData();


        showToast(
          'Produk disimpan.'
        );

      } catch (error) {

        event.currentTarget
          .querySelector(
            '.form-message'
          )
          .textContent =
          error.message;

      }

    }
  );


// ================= PRODUCTION FORM =================

$('#production-modal form')
  .addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const usage =
        [
          ...document.querySelectorAll(
            '#usage-fields .dynamic-row'
          )
        ]

          .map(
            (row) => ({

              bahan_baku_id:
                row.querySelector(
                  '.usage-material'
                ).value,

              jumlah:
                Number(
                  row.querySelector(
                    '.usage-amount'
                  ).value
                )

            })
          )

          .filter(
            (item) =>
              item.bahan_baku_id &&
              item.jumlah > 0
          );


      if (!usage.length) {

        event.currentTarget
          .querySelector(
            '.form-message'
          )
          .textContent =
          'Tambahkan minimal satu bahan baku.';

        return;
      }


      try {

        await rpc(
          'catat_produksi',
          {

            p_nomor_produksi:
              $('#production-number').value,

            p_produk_id:
              $('#production-product').value,

            p_jumlah:
              Number(
                $('#production-amount').value
              ),

            p_catatan:
              $('#production-note').value ||
              null,

            p_pemakaian:
              usage

          }
        );


        closeModal(
          $('#production-modal')
        );


        event.currentTarget.reset();

        $('#usage-fields').innerHTML =
          '';


        await loadData();


        showToast(
          'Produksi dicatat dan stok diperbarui.'
        );

      } catch (error) {

        event.currentTarget
          .querySelector(
            '.form-message'
          )
          .textContent =
          error.message;

      }

    }
  );


// ================= SALES FORM =================

$('#sale-modal form')
  .addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const items =
        [
          ...document.querySelectorAll(
            '#sale-fields .dynamic-row'
          )
        ]

          .map(
            (row) => ({

              produk_id:
                row.querySelector(
                  '.sale-product'
                ).value,

              jumlah:
                Number(
                  row.querySelector(
                    '.sale-amount'
                  ).value
                )

            })
          )

          .filter(
            (item) =>
              item.produk_id &&
              item.jumlah > 0
          );


      if (!items.length) {

        event.currentTarget
          .querySelector(
            '.form-message'
          )
          .textContent =
          'Tambahkan minimal satu barang.';

        return;
      }


      try {

        await rpc(
          'catat_penjualan',
          {

            p_nomor_nota:
              $('#sale-number').value,

            p_pelanggan:
              $('#sale-customer').value,

            p_items:
              items

          }
        );


        closeModal(
          $('#sale-modal')
        );


        event.currentTarget.reset();

        $('#sale-customer').value =
          'Umum';

        $('#sale-fields').innerHTML =
          '';


        await loadData();


        showToast(
          'Penjualan dicatat dan stok barang jadi berkurang.'
        );

      } catch (error) {

        event.currentTarget
          .querySelector(
            '.form-message'
          )
          .textContent =
          error.message;

      }

    }
  );


// ================= SETTINGS =================

$('#settings-button')
  .addEventListener(
    'click',
    () =>
      showToast(
        `Terhubung ke ${state.config.url}`
      )
  );


// ================= DATE =================

$('#today').textContent =
  new Intl.DateTimeFormat(
    'id-ID',
    {
      dateStyle: 'full'
    }
  ).format(
    new Date()
  );


// ================= START =================

loadData();

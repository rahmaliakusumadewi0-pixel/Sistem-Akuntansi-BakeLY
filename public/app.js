// ============================================================
// SISTEM AKUNTANSI BAKELY
// Supabase + GitHub Pages
// ============================================================

const SUPABASE_URL = "https://kjoyivzexlbqytccoczs.supabase.co";
const SUPABASE_KEY = "sb_publishable_W3Rybv-DV6yXj1N5bMxFmA_cklC0xuC";

const state = {
    config: {
        url: SUPABASE_URL,
        key: SUPABASE_KEY
    },
    sales: [],
    materials: [],
    products: [],
    productions: [],
    usages: []
};

// ============================================================
// HELPER
// ============================================================

const $ = (selector) => document.querySelector(selector);

const rupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value || 0));

const quantity = (value) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 2
    }).format(Number(value || 0));

const dateId = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short"
    });
};

const fullDateId = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
};


// ============================================================
// SUPABASE REST API
// ============================================================

async function supabaseRequest(endpoint, options = {}) {

    const response = await fetch(
        `${state.config.url}/rest/v1/${endpoint}`,
        {
            ...options,

            headers: {
                apikey: state.config.key,
                Authorization: `Bearer ${state.config.key}`,
                "Content-Type": "application/json",
                Prefer:
                    options.method === "POST"
                        ? "return=representation"
                        : "return=representation",

                ...(options.headers || {})
            }
        }
    );

    const text = await response.text();

    let body = {};

    try {
        body = text ? JSON.parse(text) : {};
    } catch {
        body = text;
    }

    if (!response.ok) {

        const message =
            body?.message ||
            body?.hint ||
            body?.details ||
            body?.error_description ||
            body?.error ||
            "Permintaan ke Supabase gagal.";

        throw new Error(message);
    }

    return body;
}


// ============================================================
// CRUD API
// ============================================================

async function api(path, options = {}) {
    return supabaseRequest(path, options);
}


// ============================================================
// RPC SUPABASE
// ============================================================

async function rpc(name, payload) {

    return supabaseRequest(`rpc/${name}`, {
        method: "POST",
        body: JSON.stringify(payload)
    });
}


// ============================================================
// LOAD DATA
// ============================================================

async function loadData() {

    try {

        const results = await Promise.allSettled([

            api(
                "penjualan?select=*&order=tanggal.desc&limit=30"
            ),

            api(
                "bahan_baku?select=*&order=nama.asc"
            ),

            api(
                "produk?select=*&order=nama.asc"
            ),

            api(
                "produksi?select=*,produk(nama)&order=tanggal.desc&limit=30"
            ),

            api(
                "pemakaian_bb?select=*,bahan_baku(nama,satuan),produksi(nomor_produksi,tanggal)&order=created_at.desc&limit=50"
            )

        ]);

        const [
            sales,
            materials,
            products,
            productions,
            usages
        ] = results.map((result) =>
            result.status === "fulfilled"
                ? result.value
                : []
        );

        state.sales = Array.isArray(sales) ? sales : [];
        state.materials = Array.isArray(materials) ? materials : [];
        state.products = Array.isArray(products) ? products : [];
        state.productions = Array.isArray(productions) ? productions : [];
        state.usages = Array.isArray(usages) ? usages : [];

        const failedRequests =
            results.filter(
                (result) => result.status === "rejected"
            );

        if ($("#connection-label")) {
            $("#connection-label").textContent =
                failedRequests.length
                    ? "Supabase sebagian terhubung"
                    : "Supabase terhubung";
        }

        const dot = $(".status-dot");

        if (dot) {
            dot.style.background =
                failedRequests.length
                    ? "#d89a55"
                    : "#79a267";
        }

        render();

        if (failedRequests.length) {

            const firstError =
                failedRequests[0].reason?.message ||
                "Sebagian data gagal dimuat.";

            showToast(firstError);
        }

    } catch (error) {

        console.error(error);

        if ($("#connection-label")) {
            $("#connection-label").textContent =
                "Koneksi gagal";
        }

        const dot = $(".status-dot");

        if (dot) {
            dot.style.background = "#c96b5c";
        }

        showToast(error.message);

        render();
    }
}


// ============================================================
// EMPTY TABLE
// ============================================================

function emptyRow(columns, text = "Belum ada data.") {

    return `
        <tr>
            <td colspan="${columns}" class="empty-state">
                ${text}
            </td>
        </tr>
    `;
}


// ============================================================
// MAIN RENDER
// ============================================================

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
                Number(item.stok || 0) <=
                Number(item.stok_minimum || 0)
        );


    // ========================================================
    // DASHBOARD CARDS
    // ========================================================

    if ($("#sales-total"))
        $("#sales-total").textContent =
            rupiah(salesTotal);

    if ($("#sales-count"))
        $("#sales-count").textContent =
            `${state.sales.length} transaksi`;

    if ($("#finished-total"))
        $("#finished-total").textContent =
            `${quantity(finishedTotal)} pcs`;

    if ($("#product-count"))
        $("#product-count").textContent =
            `${state.products.filter(
                (item) => item.aktif !== false
            ).length} produk aktif`;

    if ($("#inventory-total"))
        $("#inventory-total").textContent =
            rupiah(inventoryValue);

    if ($("#low-stock-count"))
        $("#low-stock-count").textContent =
            `${lowStock.length} bahan`;


    // ========================================================
    // LOW STOCK
    // ========================================================

    if ($("#low-stock-list")) {

        $("#low-stock-list").innerHTML =
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
                    .join("")

                : `
                    <p class="empty-state">
                        Semua stok aman.
                    </p>
                `;
    }


    // ========================================================
    // RECENT SALES
    // ========================================================

    if ($("#recent-sales")) {

        $("#recent-sales").innerHTML =
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
                                    ${sale.pelanggan || "-"}
                                </td>

                                <td class="align-right">
                                    ${rupiah(sale.total)}
                                </td>

                            </tr>
                        `
                    )
                    .join("")

                : emptyRow(3);
    }


    // ========================================================
    // SALES TABLE
    // ========================================================

    if ($("#sales-table")) {

        $("#sales-table").innerHTML =
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
                                    ${sale.pelanggan || "-"}
                                </td>

                                <td>
                                    ${dateId(sale.tanggal)}
                                </td>

                                <td>
                                    <span class="tag">
                                        ${sale.status || "Selesai"}
                                    </span>
                                </td>

                                <td class="align-right">
                                    ${rupiah(sale.total)}
                                </td>

                            </tr>
                        `
                    )
                    .join("")

                : emptyRow(5);
    }


    // ========================================================
    // PRODUCTION
    // ========================================================

    if ($("#recent-production")) {

        $("#recent-production").innerHTML =
            state.productions.length

                ? state.productions
                    .slice(0, 5)
                    .map(
                        (item) =>
                            productionRow(item, false)
                    )
                    .join("")

                : emptyRow(4);
    }


    if ($("#production-table")) {

        $("#production-table").innerHTML =
            state.productions.length

                ? state.productions
                    .map(
                        (item) =>
                            productionRow(item, true)
                    )
                    .join("")

                : emptyRow(5);
    }


    // ========================================================
    // USAGE TABLE
    // ========================================================

    if ($("#usage-table")) {

        $("#usage-table").innerHTML =
            state.usages.length

                ? state.usages
                    .map(
                        (item) => `
                            <tr>

                                <td>
                                    ${
                                        item.produksi
                                            ?.nomor_produksi ||
                                        "Produksi lama"
                                    }
                                </td>

                                <td>
                                    ${
                                        item.bahan_baku?.nama ||
                                        "-"
                                    }
                                </td>

                                <td>
                                    ${quantity(item.jumlah)}
                                    ${
                                        item.bahan_baku
                                            ?.satuan || ""
                                    }
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
                    .join("")

                : emptyRow(4);
    }


    // ========================================================
    // MATERIAL TABLE
    // ========================================================

    if ($("#material-table")) {

        $("#material-table").innerHTML =
            state.materials.length

                ? state.materials
                    .map((item) => {

                        const stok =
                            Number(item.stok || 0);

                        const minimum =
                            Number(item.stok_minimum || 0);

                        let status = "aman";
                        let statusClass = "stock-ok";

                        if (stok < minimum) {
                            status = "di bawah minimum";
                            statusClass = "stock-warning";
                        }

                        else if (stok === minimum) {
                            status = "stok minimum";
                            statusClass = "stock-minimum";
                        }

                        return `
                            <tr>

                                <td>${item.nama}</td>

                                <td>${item.satuan}</td>

                                <td>${quantity(item.stok)}</td>

                                <td>${quantity(item.stok_minimum)}</td>

                                <td>
                                    ${rupiah(item.harga_satuan)}
                                </td>

                                <td>
                                    <span class="${statusClass}">
                                        ${status}
                                    </span>
                                </td>

                                <td class="row-actions">

                                    <button
                                        type="button"
                                        data-edit-material="${item.id}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        data-delete-material="${item.id}"
                                    >
                                        Hapus
                                    </button>

                                </td>

                            </tr>
                        `;
                    })
                    .join("")

                : emptyRow(7);
    }


    // ========================================================
    // PRODUCT TABLE
    // ========================================================

    if ($("#product-table")) {

        $("#product-table").innerHTML =
            state.products.length

                ? state.products
                    .map(
                        (item) => `
                            <tr>

                                <td>
                                    ${item.kode_produk || "-"}
                                </td>

                                <td>
                                    ${item.nama}
                                </td>

                                <td>
                                    ${rupiah(item.harga_jual)}
                                </td>

                                <td>
                                    ${quantity(item.stok)}
                                    ${item.satuan || "pcs"}
                                </td>

                                <td>

                                    <span
                                        class="tag ${
                                            Number(item.stok)
                                                ? ""
                                                : "tag-muted"
                                        }"
                                    >
                                        ${
                                            Number(item.stok)
                                                ? "tersedia"
                                                : "habis"
                                        }
                                    </span>

                                </td>

                                <td class="row-actions">

                                    <button
                                        type="button"
                                        data-edit-product="${item.id}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        data-delete-product="${item.id}"
                                    >
                                        Hapus
                                    </button>

                                </td>

                            </tr>
                        `
                    )
                    .join("")

                : emptyRow(6);
    }


    // ========================================================
    // CHART
    // ========================================================

    if ($("#sales-chart")) {
        $("#sales-chart").innerHTML =
            renderChart();
    }


    renderReports();
    refreshSelects();
}


// ============================================================
// REPORT
// ============================================================

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
                Number(item.stok || 0) <=
                Number(item.stok_minimum || 0)
        );

    const readyProducts =
        state.products
            .filter(
                (item) =>
                    Number(item.stok || 0) > 0
            )
            .reduce(
                (sum, item) =>
                    sum + Number(item.stok || 0),
                0
            );


    if ($("#report-sales-total"))
        $("#report-sales-total").textContent =
            rupiah(reportSalesTotal);

    if ($("#report-sales-count-detail"))
        $("#report-sales-count-detail").textContent =
            `${recentSales.length} transaksi`;

    if ($("#report-production-total"))
        $("#report-production-total").textContent =
            `${quantity(productionTotal)} pcs`;

    if ($("#report-production-count"))
        $("#report-production-count").textContent =
            `${state.productions.length} batch`;

    if ($("#report-low-stock-total"))
        $("#report-low-stock-total").textContent =
            `${lowStock.length} bahan`;

    if ($("#report-ready-product-total"))
        $("#report-ready-product-total").textContent =
            `${quantity(readyProducts)} pcs`;

    if ($("#report-ready-product-label"))
        $("#report-ready-product-label").textContent =
            `${state.products.filter(
                (item) =>
                    Number(item.stok || 0) > 0
            ).length} produk siap jual`;


    if ($("#report-sales-table")) {

        $("#report-sales-table").innerHTML =
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
                                    ${sale.pelanggan || "-"}
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
                    .join("")

                : emptyRow(4);
    }


    if ($("#report-stock-table")) {

        $("#report-stock-table").innerHTML =
            lowStock.length

                ? lowStock
                    .slice(0, 6)
                    .map(
                        (item) => `
                            <tr>

                                <td>${item.nama}</td>

                                <td>
                                    ${quantity(item.stok)}
                                    ${item.satuan}
                                </td>

                                <td>
                                    ${quantity(item.stok_minimum)}
                                </td>

                                <td>
                                    <span class="stock-warning">
                                        Perlu restock
                                    </span>
                                </td>

                            </tr>
                        `
                    )
                    .join("")

                : `
                    <tr>
                        <td colspan="4" class="empty-state">
                            Semua stok aman.
                        </td>
                    </tr>
                `;
    }
}


// ============================================================
// PRODUCTION ROW
// ============================================================

function productionRow(item, full = false) {

    const productionNumber =
        item.nomor_produksi ||
        item.nomor ||
        item.kode_produksi ||
        "-";

    return `
        <tr>

            <td>
                ${productionNumber}
            </td>

            <td>
                ${item.produk?.nama || "-"}
            </td>

            <td>
                ${quantity(item.jumlah)} pcs
            </td>

            <td>
                ${dateId(item.tanggal)}
            </td>

            ${
                full
                    ? `
                        <td>
                            ${item.catatan || "-"}
                        </td>
                    `
                    : ""
            }

        </tr>
    `;
}


// ============================================================
// SALES CHART
// ============================================================

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
            <div class="empty-state">
                Belum ada transaksi untuk grafik.
            </div>
        `;
    }

    const max = Math.max(
        ...items.map(
            (item) =>
                Number(item.total || 0)
        ),
        1
    );

    return items
        .map((item) => {

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
        })
        .join("");
}


// ============================================================
// SELECT OPTIONS
// ============================================================

function refreshSelects() {

    if ($("#production-product")) {

        $("#production-product").innerHTML =
            state.products
                .map(
                    (item) => `
                        <option value="${item.id}">
                            ${item.nama}
                            (${quantity(item.stok)}
                            ${item.satuan || "pcs"})
                        </option>
                    `
                )
                .join("");
    }


    document
        .querySelectorAll(".usage-material")
        .forEach((select) => {

            const current = select.value;

            select.innerHTML =
                state.materials
                    .map(
                        (item) => `
                            <option value="${item.id}">
                                ${item.nama}
                            </option>
                        `
                    )
                    .join("");

            select.value = current;
        });


    document
        .querySelectorAll(".sale-product")
        .forEach((select) => {

            const current = select.value;

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
                    .join("");

            select.value = current;
        });
}


// ============================================================
// DYNAMIC USAGE ROW
// ============================================================

function addUsageRow() {

    if (!$("#usage-fields")) return;

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `

        <select class="usage-material" required>
            <option value="">
                Pilih bahan baku
            </option>
        </select>

        <input
            type="number"
            class="usage-amount"
            min="0"
            step="0.01"
            placeholder="Jumlah"
            required
        >

        <button
            type="button"
            class="remove-row"
            title="Hapus baris"
        >
            ×
        </button>
    `;

    $("#usage-fields").appendChild(row);

    refreshSelects();
}


// ============================================================
// DYNAMIC SALE ROW
// ============================================================

function addSaleRow() {

    if (!$("#sale-fields")) return;

    const row = document.createElement("div");

    row.className = "dynamic-row";

    row.innerHTML = `

        <select class="sale-product" required>
            <option value="">
                Pilih produk
            </option>
        </select>

        <input
            type="number"
            class="sale-amount"
            min="1"
            step="1"
            placeholder="Jumlah"
            required
        >

        <button
            type="button"
            class="remove-row"
            title="Hapus baris"
        >
            ×
        </button>
    `;

    $("#sale-fields").appendChild(row);

    refreshSelects();
}


// ============================================================
// MODAL
// ============================================================

function openModal(id) {

    const modal = $(id);

    if (!modal) return;

    modal.classList.add("visible");

    if (
        id === "#production-modal" &&
        $("#usage-fields") &&
        !$("#usage-fields").children.length
    ) {
        addUsageRow();
    }

    if (
        id === "#sale-modal" &&
        $("#sale-fields") &&
        !$("#sale-fields").children.length
    ) {
        addSaleRow();
    }

    refreshSelects();
}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("visible");

    const message =
        modal.querySelector(".form-message");

    if (message) {
        message.textContent = "";
    }
}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("visible");

    setTimeout(() => {
        toast.classList.remove("visible");
    }, 3500);
}


// ============================================================
// NAVIGATION
// ============================================================

function goToView(view) {

    const target =
        $(`#${view}-view`);

    if (!target) return;

    document
        .querySelectorAll(".view")
        .forEach((section) =>
            section.classList.remove(
                "active-view"
            )
        );

    target.classList.add("active-view");

    document
        .querySelectorAll(".nav-item")
        .forEach((item) =>
            item.classList.toggle(
                "active",
                item.dataset.view === view
            )
        );


    const titles = {

        dashboard: [
            "Ringkasan usaha",
            "Sistem Akuntansi Bakely"
        ],

        bahan: [
            "Master data",
            "Bahan baku"
        ],

        produk: [
            "Master data",
            "Barang jadi"
        ],

        pemakaian: [
            "Transaksi",
            "Pemakaian bahan baku"
        ],

        produksi: [
            "Transaksi",
            "Produksi"
        ],

        penjualan: [
            "Transaksi",
            "Penjualan"
        ],

        laporan: [
            "Analisis usaha",
            "Laporan bakery"
        ]
    };


    if (titles[view]) {

        if ($("#page-kicker"))
            $("#page-kicker").textContent =
                titles[view][0];

        if ($("#page-title"))
            $("#page-title").textContent =
                titles[view][1];
    }
}


// ============================================================
// NAVIGATION EVENTS
// ============================================================

document
    .querySelectorAll(
        ".nav-item, [data-view-link]"
    )
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const view =
                    button.dataset.view ||
                    button.dataset.viewLink;

                if (view) {
                    goToView(view);
                }
            }
        );
    });


// ============================================================
// OPEN MODAL EVENTS
// ============================================================

document
    .querySelectorAll("[data-open]")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                openModal(
                    `#${button.dataset.open}`
                );
            }
        );
    });


// ============================================================
// CLOSE MODAL
// ============================================================

document
    .querySelectorAll(".modal-backdrop")
    .forEach((modal) => {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal ||
                    event.target.matches(
                        "[data-close-modal]"
                    )
                ) {
                    closeModal(modal);
                }
            }
        );
    });


// ============================================================
// DELETE / EDIT / REMOVE ROW
// ============================================================

document.addEventListener(
    "click",
    async (event) => {

        const materialId =
            event.target.dataset.deleteMaterial;

        const productId =
            event.target.dataset.deleteProduct;


        // REMOVE DYNAMIC ROW
        if (
            event.target.classList.contains(
                "remove-row"
            )
        ) {

            const row =
                event.target.closest(
                    ".dynamic-row"
                );

            if (row) {
                row.remove();
            }

            return;
        }


        // DELETE MATERIAL
        if (
            materialId &&
            confirm(
                "Hapus bahan baku ini?"
            )
        ) {

            try {

                await api(
                    `bahan_baku?id=eq.${encodeURIComponent(
                        materialId
                    )}`,
                    {
                        method: "DELETE"
                    }
                );

                await loadData();

                showToast(
                    "Bahan baku berhasil dihapus."
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
                "Hapus produk ini?"
            )
        ) {

            try {

                await api(
                    `produk?id=eq.${encodeURIComponent(
                        productId
                    )}`,
                    {
                        method: "DELETE"
                    }
                );

                await loadData();

                showToast(
                    "Produk berhasil dihapus."
                );

            } catch (error) {

                showToast(
                    error.message
                );
            }

            return;
        }


        // EDIT MATERIAL
        if (event.target.dataset.editMaterial) {

            const item =
                state.materials.find(
                    (material) =>
                        String(material.id) ===
                        String(
                            event.target.dataset
                                .editMaterial
                        )
                );

            if (!item) return;

            if ($("#material-id"))
                $("#material-id").value =
                    item.id;

            if ($("#material-name"))
                $("#material-name").value =
                    item.nama;

            if ($("#material-unit"))
                $("#material-unit").value =
                    item.satuan;

            if ($("#material-stock"))
                $("#material-stock").value =
                    item.stok;

            if ($("#material-minimum"))
                $("#material-minimum").value =
                    item.stok_minimum;

            if ($("#material-price"))
                $("#material-price").value =
                    item.harga_satuan;

            if ($("#material-modal-title"))
                $("#material-modal-title").textContent =
                    "Edit bahan baku";

            openModal("#material-modal");
        }
    }
);


// ============================================================
// EDIT PRODUCT
// ============================================================

document.addEventListener(
    "click",
    (event) => {

        const id =
            event.target.dataset.editProduct;

        if (!id) return;

        const item =
            state.products.find(
                (product) =>
                    String(product.id) ===
                    String(id)
            );

        if (!item) return;

        if ($("#product-id"))
            $("#product-id").value =
                item.id;

        if ($("#product-code"))
            $("#product-code").value =
                item.kode_produk || "";

        if ($("#product-name"))
            $("#product-name").value =
                item.nama;

        if ($("#product-price"))
            $("#product-price").value =
                item.harga_jual;

        if ($("#product-stock"))
            $("#product-stock").value =
                item.stok;

        if ($("#product-unit"))
            $("#product-unit").value =
                item.satuan;

        if ($("#product-modal-title"))
            $("#product-modal-title").textContent =
                "Edit barang jadi";

        openModal("#product-modal");
    }
);


// ============================================================
// SALE DETAIL
// ============================================================

document.addEventListener(
    "click",
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
                    `detail_penjualan?select=*,produk(nama)&penjualan_id=eq.${encodeURIComponent(
                        id
                    )}`
                );

            if ($("#detail-sale-number"))
                $("#detail-sale-number").textContent =
                    sale.nomor_nota;

            if ($("#detail-sale-meta"))
                $("#detail-sale-meta").textContent =
                    `${sale.pelanggan || "-"} · ${dateId(
                        sale.tanggal
                    )} · ${sale.status || "Selesai"}`;

            if ($("#detail-sale-total"))
                $("#detail-sale-total").textContent =
                    rupiah(sale.total);

            if ($("#sale-detail-table")) {

                $("#sale-detail-table").innerHTML =
                    details.length

                        ? details
                            .map(
                                (item) => `
                                    <tr>

                                        <td>
                                            ${
                                                item.produk
                                                    ?.nama ||
                                                "-"
                                            }
                                        </td>

                                        <td>
                                            ${quantity(
                                                item.jumlah
                                            )}
                                        </td>

                                        <td>
                                            ${rupiah(
                                                item.harga_satuan
                                            )}
                                        </td>

                                        <td class="align-right">
                                            ${rupiah(
                                                item.subtotal
                                            )}
                                        </td>

                                    </tr>
                                `
                            )
                            .join("")

                        : emptyRow(
                            4,
                            "Detail belum tersedia."
                        );
            }

            openModal(
                "#sale-detail-modal"
            );

        } catch (error) {

            showToast(
                error.message
            );
        }
    }
);


// ============================================================
// ADD ROW BUTTONS
// ============================================================

if ($("#add-usage")) {

    $("#add-usage").addEventListener(
        "click",
        addUsageRow
    );
}

if ($("#add-sale-item")) {

    $("#add-sale-item").addEventListener(
        "click",
        addSaleRow
    );
}


// ============================================================
// MATERIAL FORM
// ============================================================

if ($("#material-modal form")) {

    $("#material-modal form").addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const id =
                $("#material-id").value;

            const payload = {

                nama:
                    $("#material-name").value
                        .trim(),

                satuan:
                    $("#material-unit").value
                        .trim(),

                stok:
                    Number(
                        $("#material-stock").value
                    ),

                stok_minimum:
                    Number(
                        $("#material-minimum").value
                    ),

                harga_satuan:
                    Number(
                        $("#material-price").value
                    )
            };


            try {

                await api(

                    id
                        ? `bahan_baku?id=eq.${encodeURIComponent(
                            id
                        )}`
                        : "bahan_baku",

                    {

                        method:
                            id
                                ? "PATCH"
                                : "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


                closeModal(
                    $("#material-modal")
                );

                event.currentTarget.reset();

                $("#material-id").value =
                    "";

                $("#material-modal-title").textContent =
                    "Tambah bahan baku";

                await loadData();

                showToast(
                    "Bahan baku berhasil disimpan."
                );

            } catch (error) {

                const message =
                    event.currentTarget
                        .querySelector(
                            ".form-message"
                        );

                if (message) {
                    message.textContent =
                        error.message;
                }
            }
        }
    );
}


// ============================================================
// PRODUCT FORM
// ============================================================

if ($("#product-modal form")) {

    $("#product-modal form").addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const id =
                $("#product-id").value;

            const payload = {

                kode_produk:
                    $("#product-code").value
                        .trim(),

                nama:
                    $("#product-name").value
                        .trim(),

                harga_jual:
                    Number(
                        $("#product-price").value
                    ),

                stok:
                    Number(
                        $("#product-stock").value
                    ),

                satuan:
                    $("#product-unit").value
                        .trim(),

                aktif:
                    true
            };


            try {

                await api(

                    id
                        ? `produk?id=eq.${encodeURIComponent(
                            id
                        )}`
                        : "produk",

                    {

                        method:
                            id
                                ? "PATCH"
                                : "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


                closeModal(
                    $("#product-modal")
                );

                event.currentTarget.reset();

                $("#product-id").value =
                    "";

                $("#product-modal-title").textContent =
                    "Tambah barang jadi";

                await loadData();

                showToast(
                    "Produk berhasil disimpan."
                );

            } catch (error) {

                const message =
                    event.currentTarget
                        .querySelector(
                            ".form-message"
                        );

                if (message) {
                    message.textContent =
                        error.message;
                }
            }
        }
    );
}


// ============================================================
// PRODUCTION FORM
// ============================================================

if ($("#production-modal form")) {

    $("#production-modal form").addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const usage =
                [
                    ...document.querySelectorAll(
                        "#usage-fields .dynamic-row"
                    )
                ]

                    .map((row) => {

                        const material =
                            row.querySelector(
                                ".usage-material"
                            );

                        const amount =
                            row.querySelector(
                                ".usage-amount"
                            );

                        return {

                            bahan_baku_id:
                                material
                                    ? material.value
                                    : "",

                            jumlah:
                                amount
                                    ? Number(
                                        amount.value
                                    )
                                    : 0
                        };
                    })

                    .filter(
                        (item) =>
                            item.bahan_baku_id &&
                            item.jumlah > 0
                    );


            try {

                await rpc(
                    "catat_produksi",
                    {

                        p_nomor_produksi:
                            $("#production-number")
                                .value,

                        p_produk_id:
                            $("#production-product")
                                .value,

                        p_jumlah:
                            Number(
                                $("#production-amount")
                                    .value
                            ),

                        p_catatan:
                            $("#production-note")
                                .value
                                .trim() ||
                            null,

                        p_pemakaian:
                            usage
                    }
                );


                closeModal(
                    $("#production-modal")
                );

                event.currentTarget.reset();

                if ($("#usage-fields")) {
                    $("#usage-fields").innerHTML =
                        "";
                }

                await loadData();

                showToast(
                    "Produksi berhasil dicatat dan stok diperbarui."
                );

            } catch (error) {

                const message =
                    event.currentTarget
                        .querySelector(
                            ".form-message"
                        );

                if (message) {
                    message.textContent =
                        error.message;
                }

                console.error(error);
            }
        }
    );
}


// ============================================================
// SALES FORM
// ============================================================

if ($("#sale-modal form")) {

    $("#sale-modal form").addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const items =
                [
                    ...document.querySelectorAll(
                        "#sale-fields .dynamic-row"
                    )
                ]

                    .map((row) => {

                        const product =
                            row.querySelector(
                                ".sale-product"
                            );

                        const amount =
                            row.querySelector(
                                ".sale-amount"
                            );

                        return {

                            produk_id:
                                product
                                    ? product.value
                                    : "",

                            jumlah:
                                amount
                                    ? Number(
                                        amount.value
                                    )
                                    : 0
                        };
                    })

                    .filter(
                        (item) =>
                            item.produk_id &&
                            item.jumlah > 0
                    );


            if (!items.length) {

                const message =
                    event.currentTarget
                        .querySelector(
                            ".form-message"
                        );

                if (message) {
                    message.textContent =
                        "Tambahkan minimal satu produk.";
                }

                return;
            }


            try {

                await rpc(
                    "catat_penjualan",
                    {

                        p_nomor_nota:
                            $("#sale-number")
                                .value,

                        p_pelanggan:
                            $("#sale-customer")
                                .value
                                .trim(),

                        p_items:
                            items
                    }
                );


                closeModal(
                    $("#sale-modal")
                );

                event.currentTarget.reset();

                if ($("#sale-fields")) {
                    $("#sale-fields").innerHTML =
                        "";
                }

                await loadData();

                showToast(
                    "Penjualan berhasil dicatat dan stok barang jadi berkurang."
                );

            } catch (error) {

                const message =
                    event.currentTarget
                        .querySelector(
                            ".form-message"
                        );

                if (message) {
                    message.textContent =
                        error.message;
                }

                console.error(error);
            }
        }
    );
}


// ============================================================
// SETTINGS
// ============================================================

if ($("#settings-button")) {

    $("#settings-button").addEventListener(
        "click",
        () =>
            showToast(
                `Terhubung ke ${state.config.url}`
            )
    );
}


// ============================================================
// DATE
// ============================================================

if ($("#today")) {

    $("#today").textContent =
        new Intl.DateTimeFormat(
            "id-ID",
            {
                dateStyle: "full"
            }
        ).format(new Date());
}


// ============================================================
// START APPLICATION
// ============================================================

loadData();

import qrcode

# contenuto che vuoi codificare (URL, testo, vCard, wifi string, ecc.)
data = "https://felagenova.github.io/Fela-/"  

qr = qrcode.QRCode(
    version=None,               # lascia auto (adattivo)
    error_correction=qrcode.constants.ERROR_CORRECT_M,
    box_size=10,
    border=4,
)
qr.add_data(data)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
img.save("mio_qr.png")
print("QR salvato come mio_qr.png")


# MRP Office Portal 🏢
**PT MULTIBANGUN REKATAMA PATRIA**

Official company portal for letter generation, PO tracking, and internal requests.

## 🚀 Step-by-Step: How to Make it Live
Your team cannot access a ZIP file. Follow these steps to publish:

1. **Clean up your GitHub**:
   - Log in to GitHub and go to your `multibangun` repository.
   - Delete the `mrp-office-portal.zip` file.
   - Click **Add file** > **Upload files**.
   - Drag all the files you downloaded (the folders like `pages`, `components`, and files like `App.tsx`, `index.html`) directly into the upload box.
   - Click **Commit changes**.

2. **Publish on Vercel**:
   - Go to [Vercel](https://vercel.com).
   - Sign up with your GitHub account.
   - Click **New Project**.
   - Import your repository.
   - Click **Deploy**.

3. **Share the Link**:
   - Vercel will give you a link like `https://mrp-office-portal.vercel.app`.
   - Send this link to your team.

## 🔑 Login Credentials (Set by Admin)
- **Initial Admin User**: `admin`
- **Initial Admin Password**: `admin123`
- *Go to "Admin Panel" inside the portal to create accounts for Secretary and Purchasing.*

## 📂 Features
- **Auto-Numbering**: Strictly follows `[seq]/MRP/[CODE]/[MONTH]/[YEAR]`.
- **Intelligent Archive**: Flags letters that don't have a signed soft-copy uploaded yet.
- **PPU Integration**: Ready for the finance form integration.
